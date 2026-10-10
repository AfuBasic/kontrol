<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->securityRole = Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    Permission::firstOrCreate(['name' => 'security.view', 'guard_name' => 'web']);
    $adminRole->givePermissionTo('security.view');

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

    $this->guard = function (string $name, string $membership, bool $active = true): User {
        $user = User::factory()->create(['name' => $name]);
        setPermissionsTeamId($this->estate->id);
        $user->assignRole('security');
        $this->estate->users()->attach($user->id, ['status' => $membership]);

        AdministrativeAssignment::create([
            'user_id' => $user->id,
            'estate_id' => $this->estate->id,
            'role_id' => $this->securityRole->id,
            'scope_type' => AssignmentScope::Estate,
            'is_active' => $active,
        ]);

        return $user;
    };

    ($this->guard)('Accepted Guard', 'accepted');
    ($this->guard)('Pending Guard', 'pending');
    ($this->guard)('Suspended Guard', 'accepted', active: false);

    $this->assertListed = fn (string $status, string $name) => $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.security.index', ['status' => $status]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Security/Index')
            ->loadDeferredProps('default', fn (Assert $reload) => $reload
                ->has('security.data', 1)
                ->where('security.data.0.name', $name)
            )
        );
});

it('filters security personnel by each status without a database error', function (string $status, string $name) {
    ($this->assertListed)($status, $name);
})->with([
    'pending' => ['pending', 'Pending Guard'],
    'active' => ['active', 'Accepted Guard'],
    'suspended' => ['suspended', 'Suspended Guard'],
]);
