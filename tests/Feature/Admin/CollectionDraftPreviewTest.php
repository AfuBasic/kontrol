<?php

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
use Database\Seeders\RolesAndPermissionsSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);

    EstateSettings::forEstate($this->estate->id)->update([
        'paystack_subaccount_code' => 'ACCT_test',
    ]);
});

function makeDraftPreviewResident(Estate $estate, array $overrides = []): User
{
    $resident = User::factory()->create($overrides);
    setPermissionsTeamId($estate->id);
    $resident->assignRole('resident');
    $estate->users()->attach($resident->id, ['status' => 'accepted']);

    return $resident;
}

function makeDraftZonedResident(Estate $estate, Zone $zone): User
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

it('previews target residents on a draft collection show page', function () {
    $ada = makeDraftPreviewResident($this->estate, ['name' => 'Ada Lovelace', 'email' => 'ada@example.com']);
    $grace = makeDraftPreviewResident($this->estate, ['name' => 'Grace Hopper', 'email' => 'grace@example.com']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
        'name' => 'Security Levy',
        'amount' => 15000,
        'status' => 'draft',
        'applies_to' => 'all',
        'due_at' => now()->addDays(14)->toDateString(),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', $collection->ulid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Collections/Show')
            ->where('collection.status', 'draft')
            ->where('assignments.total', 2)
            ->where('stats.total_assignments', 2)
            ->where('stats.pending_count', 2)
            ->where('stats.paid_count', 0)
            ->where('stats.total_expected', 30000)
            ->where('stats.total_collected', 0)
            ->has('assignments.data', 2)
            ->where('assignments.data.0.status', 'draft_pending')
            ->where('assignments.data.0.amount_due', 15000)
            ->where('assignments.data.0.amount_paid', 0)
            ->has('assignments.data.0.user', fn (Assert $user) => $user
                ->where('id', $ada->id)
                ->where('name', 'Ada Lovelace')
                ->where('email', 'ada@example.com')
                ->etc()
            )
            ->where('assignments.data.1.user.id', $grace->id)
        );
});

it('includes passwordless verified residents in the draft preview', function () {
    $resident = makeDraftPreviewResident($this->estate, [
        'name' => 'Social Login Resident',
        'email' => 'social@example.com',
        'password' => null,
        'email_verified_at' => now(),
    ]);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
        'status' => 'draft',
        'applies_to' => 'all',
        'amount' => 15000,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', $collection->ulid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('assignments.data', 1)
            ->where('assignments.data.0.user.id', $resident->id)
            ->where('assignments.data.0.status', 'draft_pending')
        );
});

it('filters draft target residents by search', function () {
    makeDraftPreviewResident($this->estate, ['name' => 'Ada Lovelace', 'email' => 'ada@example.com']);
    makeDraftPreviewResident($this->estate, ['name' => 'Grace Hopper', 'email' => 'grace@example.com']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
        'status' => 'draft',
        'applies_to' => 'all',
        'amount' => 10000,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', ['collection' => $collection->ulid, 'search' => 'hopper']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Collections/Show')
            ->has('assignments.data', 1)
            ->where('assignments.data.0.user.email', 'grace@example.com')
            ->where('assignments.data.0.status', 'draft_pending')
        );
});

it('previews only explicitly targeted residents on a draft collection', function () {
    $targeted = makeDraftPreviewResident($this->estate, ['name' => 'Targeted Resident']);
    makeDraftPreviewResident($this->estate, ['name' => 'Other Resident']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
        'status' => 'draft',
        'applies_to' => 'target',
        'amount' => 8000,
    ]);

    $collection->targets()->create([
        'target_type' => User::class,
        'target_id' => $targeted->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', $collection->ulid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('assignments.data', 1)
            ->where('assignments.data.0.user.id', $targeted->id)
            ->where('assignments.data.0.status', 'draft_pending')
        );
});

it('previews only residents in the targeted zone on a draft collection', function () {
    $zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
    $zoneB = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone B']);

    $residentA = makeDraftZonedResident($this->estate, $zoneA);
    makeDraftZonedResident($this->estate, $zoneB);

    $this->actingAs($this->admin);

    $collection = app(CollectionService::class)->createCollection($this->estate, [
        'name' => 'Zone A Draft Levy',
        'amount' => 20000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addWeek()->toDateString(),
        'applies_to' => 'zone',
        'zones' => [$zoneA->id],
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', $collection->ulid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('collection.status', 'draft')
            ->has('assignments.data', 1)
            ->where('assignments.data.0.user.id', $residentA->id)
            ->where('assignments.data.0.status', 'draft_pending')
        );
});

it('does not replace real assignments with a preview after a collection is published', function () {
    $resident = makeDraftPreviewResident($this->estate, ['name' => 'Billed Resident']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $this->admin->id,
        'status' => 'active',
        'applies_to' => 'all',
        'amount' => 12000,
    ]);

    CollectionAssignment::factory()->create([
        'collection_id' => $collection->id,
        'estate_id' => $this->estate->id,
        'user_id' => $resident->id,
        'amount_due' => 12000,
        'amount_paid' => 4000,
        'status' => 'partial',
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', $collection->ulid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('collection.status', 'active')
            ->has('assignments.data', 1)
            ->where('assignments.data.0.status', 'partial')
            ->where('assignments.data.0.amount_paid', 4000)
            ->where('assignments.data.0.user.id', $resident->id)
        );
});

it('excludes the collection creator from the draft preview unless they opted in', function () {
    $creator = makeDraftPreviewResident($this->estate, ['name' => 'Creator Resident']);
    $resident = makeDraftPreviewResident($this->estate, ['name' => 'Other Resident']);

    $collection = Collection::factory()->create([
        'estate_id' => $this->estate->id,
        'created_by' => $creator->id,
        'status' => 'draft',
        'applies_to' => 'all',
        'include_creator' => false,
        'amount' => 5000,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', $collection->ulid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('assignments.data', 1)
            ->where('assignments.data.0.user.id', $resident->id)
        );

    $collection->update(['include_creator' => true]);

    $this->actingAs($this->admin)
        ->get(route('admin.collections.show', $collection->ulid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('assignments.data', 2)
        );
});
