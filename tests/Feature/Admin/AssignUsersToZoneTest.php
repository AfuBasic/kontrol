<?php

use App\Enums\AssignmentScope;
use App\Events\Admin\ResidentCreated;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);

    foreach (['residents.view', 'residents.edit', 'residents.reset-password', 'property_owners.view', 'property_owners.edit'] as $permission) {
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

    $this->zone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'North Gate',
    ]);
});

function asAdmin()
{
    return test()->actingAs(test()->admin)
        ->withSession(['active_context_assignment_id' => test()->adminAssignment->id]);
}

function createEstateResident(array $membership = []): User
{
    $resident = User::factory()->create();
    setPermissionsTeamId(test()->estate->id);
    $resident->assignRole('resident');
    test()->estate->users()->attach($resident->id, array_merge([
        'status' => 'accepted',
        'relationship_type' => 'resident',
        'zone_id' => null,
    ], $membership));

    return $resident;
}

function createEstatePropertyOwner(array $membership = []): User
{
    $owner = User::factory()->create();
    setPermissionsTeamId(test()->estate->id);
    $owner->assignRole('property_owner');
    test()->estate->users()->attach($owner->id, array_merge([
        'status' => 'accepted',
        'relationship_type' => 'property_owner',
        'zone_id' => null,
    ], $membership));

    return $owner;
}

it('bulk moves selected residents to a zone', function () {
    $first = createEstateResident();
    $second = createEstateResident();

    asAdmin()
        ->from(route('admin.residents.index'))
        ->post(route('admin.residents.bulk-assign-zone'), [
            'ids' => [$first->id, $second->id],
            'zone_id' => $this->zone->id,
        ])
        ->assertRedirect(route('admin.residents.index'))
        ->assertSessionHas('success');

    expect($first->estates()->where('estates.id', $this->estate->id)->first()?->pivot?->zone_id)->toBe($this->zone->id)
        ->and($second->estates()->where('estates.id', $this->estate->id)->first()?->pivot?->zone_id)->toBe($this->zone->id);
});

it('bulk moves selected residents back to the entire estate', function () {
    $resident = createEstateResident(['zone_id' => $this->zone->id]);

    asAdmin()
        ->from(route('admin.residents.index'))
        ->post(route('admin.residents.bulk-assign-zone'), [
            'ids' => [$resident->id],
            'zone_id' => null,
        ])
        ->assertRedirect(route('admin.residents.index'));

    expect($resident->estates()->where('estates.id', $this->estate->id)->first()?->pivot?->zone_id)->toBeNull();
});

it('includes a zone field on the resident edit page when zones exist', function () {
    $resident = createEstateResident();

    asAdmin()
        ->get(route('admin.residents.edit', $resident))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Residents/Edit')
            ->where('resident.zone_id', null)
            ->has('zones', 1)
            ->where('zones.0.name', 'North Gate')
        );
});

it('updates a resident zone from the edit page', function () {
    $resident = createEstateResident();

    asAdmin()
        ->put(route('admin.residents.update', $resident), [
            'name' => $resident->name,
            'email' => $resident->email,
            'zone_id' => $this->zone->id,
        ])
        ->assertRedirect(route('admin.residents.index'));

    expect($resident->estates()->where('estates.id', $this->estate->id)->first()?->pivot?->zone_id)->toBe($this->zone->id);
});

it('includes a zone field on the property owner edit page when zones exist', function () {
    $owner = createEstatePropertyOwner();

    asAdmin()
        ->get(route('admin.property-owners.edit', $owner))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/PropertyOwners/Edit')
            ->where('propertyOwner.zone_id', null)
            ->has('zones', 1)
            ->where('zones.0.name', 'North Gate')
        );
});

it('updates a property owner zone from the edit page', function () {
    $owner = createEstatePropertyOwner();

    asAdmin()
        ->put(route('admin.property-owners.update', $owner), [
            'name' => $owner->name,
            'email' => $owner->email,
            'zone_id' => $this->zone->id,
        ])
        ->assertRedirect(route('admin.property-owners.index'));

    expect($owner->estates()->where('estates.id', $this->estate->id)->first()?->pivot?->zone_id)->toBe($this->zone->id);
});

it('broadcasts invitation resent instead of password reset', function () {
    Event::fake([ResidentCreated::class]);

    $resident = createEstateResident();

    asAdmin()
        ->from(route('admin.residents.index'))
        ->post(route('admin.residents.resend-invitation', $resident))
        ->assertRedirect();

    Event::assertDispatched(ResidentCreated::class, function (ResidentCreated $event) use ($resident) {
        return $event->isResend
            && $event->user->is($resident)
            && $event->broadcastWith()['message'] === "Invitation resent for {$resident->name}";
    });
});
