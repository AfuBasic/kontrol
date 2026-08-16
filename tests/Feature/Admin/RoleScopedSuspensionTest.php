<?php

use App\Actions\Admin\CreateResidentAction;
use App\Actions\Admin\CreateSecurityAction;
use App\Actions\Admin\SuspendSecurityAction;
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
    foreach (['security.view', 'security.create', 'security.delete', 'security.suspend', 'residents.view', 'residents.delete', 'residents.suspend'] as $permission) {
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

test('suspending security role on a dual-role user only deactivates security assignment and leaves suspended_at null', function () {
    $this->actingAs($this->admin);

    // 1. Create resident and add security role
    $user = app(CreateResidentAction::class)->execute([
        'name' => 'Dual Role User',
        'email' => 'dual@example.com',
    ], $this->estate);

    app(CreateSecurityAction::class)->execute([
        'name' => 'Dual Role User',
        'email' => 'dual@example.com',
    ], $this->estate);

    $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();
    $residentRole = Role::where('name', 'resident')->whereNull('estate_id')->first();

    // 2. Suspend security role
    $suspendSecurity = app(SuspendSecurityAction::class);
    $suspendSecurity->execute($user, $this->estate);

    $securityAssignment = AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $securityRole->id)->first();
    $residentAssignment = AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $residentRole->id)->first();

    // Security assignment is inactive
    expect($securityAssignment->is_active)->toBeFalse();

    // Resident assignment is still active
    expect($residentAssignment->is_active)->toBeTrue();

    // Overall user suspended_at is still null because user has another active role!
    $user->refresh();
    expect($user->suspended_at)->toBeNull();
});

test('suspending single-role user deactivates assignment and sets suspended_at timestamp', function () {
    $this->actingAs($this->admin);

    $user = app(CreateSecurityAction::class)->execute([
        'name' => 'Single Role Guard',
        'email' => 'guard@example.com',
    ], $this->estate);

    $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();

    $suspendSecurity = app(SuspendSecurityAction::class);
    $suspendSecurity->execute($user, $this->estate);

    $securityAssignment = AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $securityRole->id)->first();

    expect($securityAssignment->is_active)->toBeFalse();

    $user->refresh();
    expect($user->suspended_at)->not->toBeNull();

    // Reactivate
    $suspendSecurity->execute($user, $this->estate);

    $securityAssignment->refresh();
    $user->refresh();

    expect($securityAssignment->is_active)->toBeTrue();
    expect($user->suspended_at)->toBeNull();
});
