<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);

    foreach (['residents.view', 'residents.create', 'property_owners.view'] as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
    }

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

function asAdmin()
{
    return test()->actingAs(test()->admin)
        ->withSession(['active_context_assignment_id' => test()->adminAssignment->id]);
}

it('labels estate-scoped residents as Entire Estate', function () {
    $resident = User::factory()->create(['name' => 'Estate Resident']);
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, [
        'status' => 'accepted',
        'zone_id' => null,
    ]);

    asAdmin()
        ->get(route('admin.residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Residents/Index')
            ->loadDeferredProps('default', fn (Assert $reload) => $reload
                ->has('residents.data', 1)
                ->where('residents.data.0.id', $resident->id)
                ->where('residents.data.0.zone_name', 'Entire Estate')
            )
        );
});

it('labels zone-scoped residents with their zone name', function () {
    $zone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'North Gate',
    ]);

    $resident = User::factory()->create(['name' => 'Zoned Resident']);
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, [
        'status' => 'accepted',
        'zone_id' => $zone->id,
    ]);

    asAdmin()
        ->get(route('admin.residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Residents/Index')
            ->loadDeferredProps('default', fn (Assert $reload) => $reload
                ->has('residents.data', 1)
                ->where('residents.data.0.id', $resident->id)
                ->where('residents.data.0.zone_name', 'North Gate')
            )
        );
});

it('labels estate-scoped property owners as Entire Estate', function () {
    $owner = User::factory()->create(['name' => 'Estate Owner']);
    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $this->estate->users()->attach($owner->id, [
        'status' => 'accepted',
        'zone_id' => null,
    ]);

    asAdmin()
        ->get(route('admin.property-owners.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/PropertyOwners/Index')
            ->has('propertyOwners.data', 1)
            ->where('propertyOwners.data.0.zone_name', 'Entire Estate')
        );
});

it('labels zone-scoped property owners with their zone name', function () {
    $zone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'South Block',
    ]);

    $owner = User::factory()->create(['name' => 'Zoned Owner']);
    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $this->estate->users()->attach($owner->id, [
        'status' => 'accepted',
        'zone_id' => $zone->id,
    ]);

    asAdmin()
        ->get(route('admin.property-owners.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/PropertyOwners/Index')
            ->has('propertyOwners.data', 1)
            ->where('propertyOwners.data.0.zone_name', 'South Block')
        );
});

it('resolves ContextManager on resident pages that use it', function () {
    asAdmin()
        ->get(route('admin.residents.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Residents/Create'));
});
