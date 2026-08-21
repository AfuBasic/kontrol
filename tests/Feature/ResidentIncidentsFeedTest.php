<?php

use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'household_member', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
});

test('resident incidents index receives estate configured categories and total count', function () {
    $estate = Estate::factory()->create();
    $settings = EstateSettings::forEstate($estate->id);
    $settings->incident_categories = ['Noise Complaint', 'Medical Emergency', 'Security'];
    $settings->save();

    $user = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $user->id,
        'reporter_type' => User::class,
        'title' => 'Loud Party at 2 AM',
        'body' => 'Loud music coming from flat 4B continuously.',
        'category' => 'Noise Complaint',
        'status' => 'pending',
    ]);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.incidents.index'));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Resident/Incidents/Index')
        ->has('incidents.data', 1)
        ->where('incidents.data.0.title', 'Loud Party at 2 AM')
        ->where('incidents.data.0.category', 'Noise Complaint')
        ->where('totalIncidentsCount', 1)
        ->has('categories', 4) // Noise Complaint, Medical Emergency, Security, Other
    );
});

test('true zero state reports zero total incidents when estate is empty', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.incidents.index'));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Resident/Incidents/Index')
        ->has('incidents.data', 0)
        ->where('totalIncidentsCount', 0)
    );
});

test('filtered query returns zero results but total incidents count remains positive', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $user->id,
        'reporter_type' => User::class,
        'title' => 'Water Leak on Block B',
        'body' => 'Water pipe burst behind building 2.',
        'category' => 'water_plumbing',
        'status' => 'pending',
    ]);

    // Query for search keyword that has 0 matches
    $response = $this->actingAs($user)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.incidents.index', ['search' => 'NonExistentKeyword']));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Resident/Incidents/Index')
        ->has('incidents.data', 0)
        ->where('totalIncidentsCount', 1)
    );
});

test('upvote toggle reflects on incident is_upvoted and upvotes_count', function () {
    $estate = Estate::factory()->create();
    $author = User::factory()->create();
    $resident = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $author->assignRole('resident');
    $author->estates()->attach($estate->id, ['status' => 'accepted']);
    $resident->assignRole('resident');
    $resident->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $author->id,
        'reporter_type' => User::class,
        'title' => 'Main Gate Sensor Malfunction',
        'body' => 'Barrier gate arm does not open with RFID card.',
        'category' => 'security',
        'status' => 'pending',
    ]);

    // Resident upvotes
    $response = $this->actingAs($resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.upvote', $incident->hashid));

    $response->assertRedirect();
    expect($incident->fresh()->upvotes_count)->toBe(1);

    // Index reflects upvote for this resident
    $indexResponse = $this->actingAs($resident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.incidents.index'));

    $indexResponse->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Resident/Incidents/Index')
        ->where('incidents.data.0.is_upvoted', true)
        ->where('incidents.data.0.upvotes_count', 1)
    );
});
