<?php

use App\Actions\Admin\CreateResidentAction;
use App\Actions\Admin\CreateSecurityAction;
use App\Actions\Admin\DeleteResidentAction;
use App\Actions\Admin\DeleteSecurityAction;
use App\Actions\Admin\BulkDeleteSecurityAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();
    foreach (['security.view', 'security.create', 'security.delete', 'residents.view', 'residents.delete'] as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

    $this->adminAssignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);
});

test('deleting a user from security when they are also a resident only revokes security role', function () {
    $this->actingAs($this->admin);

    // 1. Create resident
    $residentAction = app(CreateResidentAction::class);
    $user = $residentAction->execute([
        'name' => 'Dual Role User',
        'email' => 'dual@example.com',
    ], $this->estate);

    // 2. Add security role to the same user
    $securityAction = app(CreateSecurityAction::class);
    $securityAction->execute([
        'name' => 'Dual Role User',
        'email' => 'dual@example.com',
    ], $this->estate);

    $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();
    $residentRole = Role::where('name', 'resident')->whereNull('estate_id')->first();

    // Verify both assignments exist
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $securityRole->id)->exists())->toBeTrue();
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $residentRole->id)->exists())->toBeTrue();

    // 3. Delete from Security
    $deleteSecurityAction = app(DeleteSecurityAction::class);
    $deleteSecurityAction->execute($user, $this->estate);

    // 4. Assertions
    // Security assignment removed
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $securityRole->id)->exists())->toBeFalse();

    // Resident assignment and user record still exist in the database!
    expect(User::where('id', $user->id)->exists())->toBeTrue();
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $residentRole->id)->exists())->toBeTrue();

    // Estate membership still exists
    expect($this->estate->users()->where('users.id', $user->id)->exists())->toBeTrue();
});

test('deleting a user from security when they have only security role deletes the user', function () {
    $this->actingAs($this->admin);

    $securityAction = app(CreateSecurityAction::class);
    $user = $securityAction->execute([
        'name' => 'Only Security Guard',
        'email' => 'onlysec@example.com',
    ], $this->estate);

    $deleteSecurityAction = app(DeleteSecurityAction::class);
    $deleteSecurityAction->execute($user, $this->estate);

    expect(User::where('id', $user->id)->exists())->toBeFalse();
    expect(AdministrativeAssignment::where('user_id', $user->id)->exists())->toBeFalse();
});

test('bulk deleting security only removes security role for dual role users', function () {
    $this->actingAs($this->admin);

    // User 1: Dual role (resident + security)
    $u1 = app(CreateResidentAction::class)->execute(['name' => 'U1', 'email' => 'u1@example.com'], $this->estate);
    app(CreateSecurityAction::class)->execute(['name' => 'U1', 'email' => 'u1@example.com'], $this->estate);

    // User 2: Security only
    $u2 = app(CreateSecurityAction::class)->execute(['name' => 'U2', 'email' => 'u2@example.com'], $this->estate);

    $bulkDelete = app(BulkDeleteSecurityAction::class);
    $count = $bulkDelete->execute([$u1->id, $u2->id], $this->estate);

    expect($count)->toBe(2);

    // U1 still exists as resident
    expect(User::where('id', $u1->id)->exists())->toBeTrue();
    expect($this->estate->users()->where('users.id', $u1->id)->exists())->toBeTrue();

    // U2 was deleted entirely
    expect(User::where('id', $u2->id)->exists())->toBeFalse();
});
