<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'residents.view', 'guard_name' => 'web']);
    $adminRole->givePermissionTo('residents.view');

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

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

function fetchResidentInsights(): array
{
    Inertia::version('test');

    return test()->actingAs(test()->admin)
        ->withSession(['active_context_assignment_id' => test()->adminAssignment->id])
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Partial-Component' => 'Admin/Residents/Index',
            'X-Inertia-Partial-Data' => 'insights',
            'X-Inertia-Version' => 'test',
        ])
        ->get(route('admin.residents.index'))
        ->assertOk()
        ->json('props.insights');
}

it('says verified invite-link signups are awaiting admin approval', function () {
    $resident = User::factory()->create([
        'password' => null,
        'email_verified_at' => now(),
    ]);
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'pending']);

    $insights = fetchResidentInsights();

    expect($insights)->toContain('1 resident is awaiting admin approval.')
        ->not->toContain('1 resident has not accepted their invitation.')
        ->not->toContain('1 residents have not accepted their invitations.');
});

it('says unverified invited residents have not accepted their invitation', function () {
    $resident = User::factory()->unverified()->create([
        'password' => null,
    ]);
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, ['status' => 'pending']);

    $insights = fetchResidentInsights();

    expect($insights)->toContain('1 resident has not accepted their invitation.')
        ->not->toContain('1 resident is awaiting admin approval.');
});
