<?php

use App\Actions\Admin\CreatePropertyOwnerAction;
use App\Actions\Admin\CreateResidentAction;
use App\Actions\Admin\MarkPropertyOwnerAsResidentAction;
use App\Actions\Admin\MarkResidentAsPropertyOwnerAction;
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
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();
    foreach (['property_owners.view', 'property_owners.create', 'property_owners.edit', 'residents.view', 'residents.create', 'residents.edit'] as $permission) {
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

test('swapping a resident to a property owner removes resident role and gives property owner role', function () {
    $this->actingAs($this->admin);

    $residentAction = app(CreateResidentAction::class);
    $user = $residentAction->execute([
        'name' => 'Resident Jane',
        'email' => 'jane@example.com',
    ], $this->estate);

    $residentRole = Role::where('name', 'resident')->whereNull('estate_id')->first();
    $poRole = Role::where('name', 'property_owner')->whereNull('estate_id')->first();

    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $residentRole->id)->exists())->toBeTrue();

    // Swap to property owner
    $swapAction = app(MarkResidentAsPropertyOwnerAction::class);
    $swapAction->execute($user, $this->estate);

    // Verify roles and assignments swapped
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $poRole->id)->exists())->toBeTrue();
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $residentRole->id)->exists())->toBeFalse();

    setPermissionsTeamId($this->estate->id);
    $user->refresh();
    expect($user->hasRole('property_owner'))->toBeTrue();
    expect($user->hasRole('resident'))->toBeFalse();
});

test('swapping a property owner to a resident removes property owner role and gives resident role', function () {
    $this->actingAs($this->admin);

    $poAction = app(CreatePropertyOwnerAction::class);
    $user = $poAction->execute([
        'name' => 'Owner John',
        'email' => 'john@example.com',
    ], $this->estate);

    $residentRole = Role::where('name', 'resident')->whereNull('estate_id')->first();
    $poRole = Role::where('name', 'property_owner')->whereNull('estate_id')->first();

    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $poRole->id)->exists())->toBeTrue();

    // Swap to resident
    $swapAction = app(MarkPropertyOwnerAsResidentAction::class);
    $swapAction->execute($user, $this->estate);

    // Verify roles and assignments swapped
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $residentRole->id)->exists())->toBeTrue();
    expect(AdministrativeAssignment::where('user_id', $user->id)->where('role_id', $poRole->id)->exists())->toBeFalse();

    setPermissionsTeamId($this->estate->id);
    $user->refresh();
    expect($user->hasRole('resident'))->toBeTrue();
    expect($user->hasRole('property_owner'))->toBeFalse();
});
