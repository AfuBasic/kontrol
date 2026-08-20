<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Services\PaystackService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estate = Estate::factory()->create();

    // Seed roles and permissions
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->adminRole = Role::where('name', 'admin')->whereNull('estate_id')->firstOrFail();

    // Setup active subscription for payment feature
    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    EstateSettings::forEstate($this->estate->id)->update([
        'bank_name' => 'Access Bank',
        'bank_code' => '044',
        'account_number' => '0123456789',
        'account_name' => 'Estate Settlement Account',
    ]);

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('getBanks')->andReturn([
            ['name' => 'Access Bank', 'code' => '044'],
        ]);
    });

    // Create an estate admin user (role = admin)
    $this->adminUser = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $this->adminUser->assignRole('admin');
    $this->estate->users()->attach($this->adminUser->id, ['status' => 'accepted']);

    // Create custom manager role (estate scoped role so it can have assignments)
    $this->managerRole = Role::create([
        'name' => 'manager',
        'guard_name' => 'web',
        'estate_id' => $this->estate->id,
    ]);

    // Create a staff user with custom manager role
    $this->managerUser = User::factory()->create();
    $this->managerUser->assignRole($this->managerRole);
    $this->estate->users()->attach($this->managerUser->id, ['status' => 'accepted']);

    // Create authoritative assignments for both users
    $createAction = app(CreateAdministrativeAssignmentAction::class);

    $this->adminAssignment = $createAction->execute(
        user: $this->adminUser,
        estate: $this->estate,
        role: $this->adminRole,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );

    $this->managerAssignment = $createAction->execute(
        user: $this->managerUser,
        estate: $this->estate,
        role: $this->managerRole,
        scopeType: AssignmentScope::Estate,
        isPrimary: false
    );
});

it('restricts collections index page for manager without collections.view permission', function () {
    setPermissionsTeamId($this->estate->id);

    $this->actingAs($this->managerUser)
        ->withSession(['active_context_assignment_id' => $this->managerAssignment->id])
        ->get(route('admin.collections.index'))
        ->assertForbidden();
});

it('allows collections index page for manager with collections.view permission', function () {
    setPermissionsTeamId($this->estate->id);
    $this->managerRole->givePermissionTo('collections.view');
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->actingAs($this->managerUser)
        ->withSession(['active_context_assignment_id' => $this->managerAssignment->id])
        ->get(route('admin.collections.index'))
        ->assertOk();
});

it('restricts zones index page for manager without zones.view permission', function () {
    setPermissionsTeamId($this->estate->id);

    $this->actingAs($this->managerUser)
        ->withSession(['active_context_assignment_id' => $this->managerAssignment->id])
        ->get(route('admin.zones.index'))
        ->assertForbidden();
});

it('allows zones index page for manager with zones.view permission', function () {
    setPermissionsTeamId($this->estate->id);
    $this->managerRole->givePermissionTo('zones.view');
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->actingAs($this->managerUser)
        ->withSession(['active_context_assignment_id' => $this->managerAssignment->id])
        ->get(route('admin.zones.index'))
        ->assertOk();
});

it('restricts staff assignments index page for manager without assignments.view permission', function () {
    setPermissionsTeamId($this->estate->id);

    $this->actingAs($this->managerUser)
        ->withSession(['active_context_assignment_id' => $this->managerAssignment->id])
        ->get(route('admin.assignments.index'))
        ->assertForbidden();
});

it('allows staff assignments index page for manager with assignments.view permission', function () {
    setPermissionsTeamId($this->estate->id);
    $this->managerRole->givePermissionTo('assignments.view');
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->actingAs($this->managerUser)
        ->withSession(['active_context_assignment_id' => $this->managerAssignment->id])
        ->get(route('admin.assignments.index'))
        ->assertOk();
});

it('retains default full access for admin role context', function () {
    setPermissionsTeamId($this->estate->id);

    // Admin should access collections without needing explicit permission grant because of policy/fallback
    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.collections.index'))
        ->assertOk();

    // Admin should access zones
    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.zones.index'))
        ->assertOk();

    // Admin should access staff assignments
    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.assignments.index'))
        ->assertOk();
});
