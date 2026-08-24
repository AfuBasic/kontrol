<?php

use App\Enums\AssignmentScope;
use App\Events\Admin\ResidentCreated;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateInviteLink;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);

    foreach ([
        'residents.view',
        'residents.create',
        'residents.edit',
        'residents.reset-password',
        'property_owners.view',
        'property_owners.create',
        'property_owners.edit',
        'security.view',
        'security.create',
    ] as $permission) {
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

function asZoneAdmin(Zone $zone)
{
    $assignment = AdministrativeAssignment::firstOrCreate([
        'user_id' => test()->admin->id,
        'estate_id' => test()->estate->id,
        'role_id' => Role::where('name', 'admin')->where('guard_name', 'web')->firstOrFail()->id,
        'zone_id' => $zone->id,
    ], [
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    return test()->actingAs(test()->admin)
        ->withSession(['active_context_assignment_id' => $assignment->id]);
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

function createInviteLink(string $role, Zone $zone): EstateInviteLink
{
    return EstateInviteLink::create([
        'estate_id' => test()->estate->id,
        'role' => $role,
        'token' => Str::random(32),
        'is_active' => true,
        'usage_count' => 0,
        'max_usages' => null,
        'requires_approval' => true,
        'zone_id' => $zone->id,
    ]);
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

it('only offers in-zone property owners on resident edit for zone-scoped admins', function () {
    $otherZone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'South Gate',
    ]);
    $resident = createEstateResident(['zone_id' => $this->zone->id]);
    $inZoneOwner = createEstatePropertyOwner(['zone_id' => $this->zone->id]);
    $otherZoneOwner = createEstatePropertyOwner(['zone_id' => $otherZone->id]);

    asZoneAdmin($this->zone)
        ->get(route('admin.residents.edit', $resident))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Residents/Edit')
            ->where('propertyOwners', function ($owners) use ($inZoneOwner, $otherZoneOwner): bool {
                $ownerIds = collect($owners)->pluck('id');

                return $ownerIds->contains($inZoneOwner->id)
                    && ! $ownerIds->contains($otherZoneOwner->id);
            })
        );
});

it('rejects out-of-zone resident property owner and property updates', function () {
    $otherZone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'South Gate',
    ]);
    $resident = createEstateResident(['zone_id' => $this->zone->id]);
    $otherZoneOwner = createEstatePropertyOwner(['zone_id' => $otherZone->id]);

    $otherZoneProperty = Property::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'zone_id' => $otherZone->id,
        'property_owner_id' => $otherZoneOwner->id,
        'name' => 'South Gate Villa',
    ]);

    asZoneAdmin($this->zone)
        ->put(route('admin.residents.update', $resident), [
            'name' => $resident->name,
            'email' => $resident->email,
            'phone' => '',
            'unit_number' => '',
            'address' => '',
            'property_owner_id' => $otherZoneOwner->id,
            'property_id' => $otherZoneProperty->id,
            'zone_id' => $this->zone->id,
        ])
        ->assertSessionHasErrors(['property_owner_id', 'property_id']);
});

it('rejects cross-estate resident property owner and property on create', function () {
    $otherEstate = Estate::factory()->create();
    $otherOwner = User::factory()->create();

    setPermissionsTeamId($otherEstate->id);
    $otherOwner->assignRole('property_owner');
    $otherEstate->users()->attach($otherOwner->id, [
        'status' => 'accepted',
        'relationship_type' => 'property_owner',
    ]);

    $otherProperty = Property::withoutZoneIsolation()->create([
        'estate_id' => $otherEstate->id,
        'property_owner_id' => $otherOwner->id,
        'name' => 'Other Estate Villa',
    ]);

    setPermissionsTeamId($this->estate->id);

    asAdmin()
        ->post(route('admin.residents.store'), [
            'name' => 'Cross Estate Resident',
            'email' => 'cross-estate-resident@example.com',
            'phone' => '',
            'unit_number' => '',
            'address' => '',
            'property_owner_id' => $otherOwner->id,
            'property_id' => $otherProperty->id,
            'zone_id' => '',
        ])
        ->assertSessionHasErrors(['property_owner_id', 'property_id']);
});

it('returns a validation error when changing the estate creator resident email', function () {
    $resident = User::factory()->create(['email' => $this->estate->email]);

    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, [
        'status' => 'accepted',
        'relationship_type' => 'resident',
        'zone_id' => null,
    ]);

    asAdmin()
        ->put(route('admin.residents.update', $resident), [
            'name' => $resident->name,
            'email' => 'changed-estate-creator@example.com',
            'phone' => '',
            'unit_number' => '',
            'address' => '',
            'property_owner_id' => '',
            'property_id' => '',
            'zone_id' => '',
        ])
        ->assertSessionHasErrors('email');

    expect($resident->fresh()->email)->toBe($this->estate->email);
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

it('defaults zone scoped create form submissions to the active zone', function () {
    asZoneAdmin($this->zone)
        ->post(route('admin.residents.store'), [
            'name' => 'Zone Resident',
            'email' => 'zone-resident@example.test',
            'zone_id' => '',
        ])
        ->assertRedirect(route('admin.residents.index'));

    asZoneAdmin($this->zone)
        ->post(route('admin.property-owners.store'), [
            'name' => 'Zone Owner',
            'email' => 'zone-owner@example.test',
            'zone_id' => null,
        ])
        ->assertRedirect(route('admin.property-owners.index'));

    asZoneAdmin($this->zone)
        ->post(route('admin.security.store'), [
            'name' => 'Zone Security',
            'email' => 'zone-security@example.test',
            'zone_id' => '',
        ])
        ->assertRedirect(route('admin.security.index'));

    foreach (['zone-resident@example.test', 'zone-owner@example.test', 'zone-security@example.test'] as $email) {
        $user = User::where('email', $email)->firstOrFail();

        expect($user->estates()->where('estates.id', $this->estate->id)->first()?->pivot?->zone_id)->toBe($this->zone->id);
    }
});

it('rejects zone scoped create form submissions targeting another zone', function () {
    $otherZone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'South Gate',
    ]);

    asZoneAdmin($this->zone)
        ->from(route('admin.residents.create'))
        ->post(route('admin.residents.store'), [
            'name' => 'Wrong Resident',
            'email' => 'wrong-resident@example.test',
            'zone_id' => $otherZone->id,
        ])
        ->assertRedirect(route('admin.residents.create'))
        ->assertSessionHasErrors('zone_id');

    asZoneAdmin($this->zone)
        ->from(route('admin.property-owners.create'))
        ->post(route('admin.property-owners.store'), [
            'name' => 'Wrong Owner',
            'email' => 'wrong-owner@example.test',
            'zone_id' => $otherZone->id,
        ])
        ->assertRedirect(route('admin.property-owners.create'))
        ->assertSessionHasErrors('zone_id');

    asZoneAdmin($this->zone)
        ->from(route('admin.security.create'))
        ->post(route('admin.security.store'), [
            'name' => 'Wrong Security',
            'email' => 'wrong-security@example.test',
            'zone_id' => $otherZone->id,
        ])
        ->assertRedirect(route('admin.security.create'))
        ->assertSessionHasErrors('zone_id');
});

it('rejects a zone scoped resident assigned to an out of zone property owner', function () {
    $otherZone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'South Gate',
    ]);
    $owner = createEstatePropertyOwner(['zone_id' => $otherZone->id]);

    asZoneAdmin($this->zone)
        ->from(route('admin.residents.create'))
        ->post(route('admin.residents.store'), [
            'name' => 'Mismatched Resident',
            'email' => 'mismatched-resident@example.test',
            'property_owner_id' => $owner->id,
            'zone_id' => $this->zone->id,
        ])
        ->assertRedirect(route('admin.residents.create'))
        ->assertSessionHasErrors('property_owner_id');
});

it('only exposes active zone invite links on zone scoped create pages', function () {
    $otherZone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'South Gate',
    ]);

    createInviteLink('resident', $this->zone);
    createInviteLink('resident', $otherZone);
    createInviteLink('property_owner', $this->zone);
    createInviteLink('property_owner', $otherZone);
    createInviteLink('security', $this->zone);
    createInviteLink('security', $otherZone);

    asZoneAdmin($this->zone)
        ->get(route('admin.residents.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Residents/Create')
            ->has('inviteLinks', 1)
            ->where('inviteLinks.0.zone_id', $this->zone->id)
        );

    asZoneAdmin($this->zone)
        ->get(route('admin.property-owners.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/PropertyOwners/Create')
            ->has('inviteLinks', 1)
            ->where('inviteLinks.0.zone_id', $this->zone->id)
        );

    asZoneAdmin($this->zone)
        ->get(route('admin.security.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Security/Create')
            ->has('inviteLinks', 1)
            ->where('inviteLinks.0.zone_id', $this->zone->id)
        );
});

it('scopes invite link writes to the active zone', function () {
    $otherZone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'South Gate',
    ]);

    asZoneAdmin($this->zone)
        ->post(route('admin.residents.invite-link.store'), [
            'max_usages' => 5,
            'requires_approval' => true,
            'zone_id' => '',
        ])
        ->assertRedirect();

    $link = $this->estate->inviteLinks()->firstOrFail();
    expect($link->zone_id)->toBe($this->zone->id);

    asZoneAdmin($this->zone)
        ->from(route('admin.residents.create'))
        ->post(route('admin.residents.invite-link.store'), [
            'max_usages' => 5,
            'requires_approval' => true,
            'zone_id' => $otherZone->id,
        ])
        ->assertRedirect(route('admin.residents.create'))
        ->assertSessionHasErrors('zone_id');

    $otherLink = createInviteLink('property_owner', $otherZone);

    asZoneAdmin($this->zone)
        ->post(route('admin.property-owners.invite-link.toggle'), ['id' => $otherLink->id])
        ->assertNotFound();
});

it('broadcasts invitation resent instead of password reset', function () {
    Event::fake([ResidentCreated::class]);

    $resident = createEstateResident();
    $resident->update([
        'email_verified_at' => null,
        'password' => null,
    ]);

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
