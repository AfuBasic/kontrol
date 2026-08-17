<?php

use App\Jobs\Admin\PublishCollectionJob;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\Property;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Zone;
use App\Services\Admin\CollectionService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'collections.view']);
    Permission::firstOrCreate(['name' => 'collections.create']);
    Permission::firstOrCreate(['name' => 'collections.edit']);
    $adminRole->givePermissionTo(['collections.view', 'collections.create', 'collections.edit']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    EstateSettings::forEstate($this->estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_test',
    ]);

    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
    $this->zoneB = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone B']);
});

function makeZonedResident(Estate $estate, Zone $zone): User
{
    $resident = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, [
        'status' => 'accepted',
        'zone_id' => $zone->id,
        'relationship_type' => 'resident',
    ]);

    $property = Property::withoutZoneIsolation()->create([
        'estate_id' => $estate->id,
        'zone_id' => $zone->id,
        'property_owner_id' => $resident->id,
        'name' => 'Unit '.$zone->name,
    ]);

    UserProfile::create([
        'user_id' => $resident->id,
        'property_id' => $property->id,
    ]);

    return $resident;
}

it('stores zone targets when a collection applies to specific zones', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.collections.store'), [
            'name' => 'Zone A Levy',
            'description' => 'Security levy for Zone A',
            'amount' => 15000,
            'billing_type' => 'one_time',
            'start_date' => now()->toDateString(),
            'due_at' => now()->addDays(14)->toDateString(),
            'applies_to' => 'zone',
            'zones' => [$this->zoneA->id],
        ])
        ->assertRedirect(route('admin.collections.show', Collection::query()->where('name', 'Zone A Levy')->first()->ulid));

    $collection = Collection::query()->where('name', 'Zone A Levy')->first();

    expect($collection)->not->toBeNull()
        ->and($collection->applies_to)->toBe('zone');

    $this->assertDatabaseHas('collection_targets', [
        'collection_id' => $collection->id,
        'target_type' => Zone::class,
        'target_id' => $this->zoneA->id,
    ]);
});

it('requires at least one zone when targeting by zone', function () {
    $this->actingAs($this->admin)
        ->from(route('admin.collections.create'))
        ->post(route('admin.collections.store'), [
            'name' => 'Missing Zones',
            'amount' => 15000,
            'billing_type' => 'one_time',
            'start_date' => now()->toDateString(),
            'applies_to' => 'zone',
            'zones' => [],
        ])
        ->assertRedirect(route('admin.collections.create'))
        ->assertSessionHasErrors('zones');
});

it('publishes assignments only for residents in the targeted zone', function () {
    $residentA = makeZonedResident($this->estate, $this->zoneA);
    $residentB = makeZonedResident($this->estate, $this->zoneB);

    $this->actingAs($this->admin);

    $collection = app(CollectionService::class)->createCollection($this->estate, [
        'name' => 'Zone A Only',
        'amount' => 20000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addWeek()->toDateString(),
        'applies_to' => 'zone',
        'zones' => [$this->zoneA->id],
    ]);

    (new PublishCollectionJob($collection->id))->handle();

    expect(CollectionAssignment::withoutGlobalScopes()->where('collection_id', $collection->id)->where('user_id', $residentA->id)->exists())->toBeTrue()
        ->and(CollectionAssignment::withoutGlobalScopes()->where('collection_id', $collection->id)->where('user_id', $residentB->id)->exists())->toBeFalse();
});

it('passes zones to the collection create page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.collections.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Collections/Create')
            ->has('zones', 2)
            ->where('zones.0.name', 'Zone A'));
});
