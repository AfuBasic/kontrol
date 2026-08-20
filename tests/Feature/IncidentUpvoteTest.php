<?php

use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
});

test('resident can upvote another incident and toggle it off', function () {
    $estate = Estate::factory()->create();
    $reporter = User::factory()->create();
    $voter = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $voter->assignRole('resident');
    $voter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Water outage',
        'body' => 'No water in block C since 8am this morning.',
        'category' => 'water_plumbing',
    ]);

    // Upvote
    $response = $this->actingAs($voter)
        ->postJson(route('resident.incidents.upvote', $incident->hashid), [], [
            'X-Bypass-Mobile-Restrict' => 'true',
        ]);

    $response->assertStatus(200);
    $response->assertJson([
        'upvoted' => true,
        'upvotes_count' => 1,
    ]);
    expect($incident->fresh()->upvotes_count)->toBe(1);
    $this->assertDatabaseHas('incident_upvotes', [
        'incident_id' => $incident->id,
        'user_id' => $voter->id,
    ]);

    // Toggle off (remove upvote)
    $response = $this->actingAs($voter)
        ->postJson(route('resident.incidents.upvote', $incident->hashid), [], [
            'X-Bypass-Mobile-Restrict' => 'true',
        ]);

    $response->assertStatus(200);
    $response->assertJson([
        'upvoted' => false,
        'upvotes_count' => 0,
    ]);
    expect($incident->fresh()->upvotes_count)->toBe(0);
    $this->assertDatabaseMissing('incident_upvotes', [
        'incident_id' => $incident->id,
        'user_id' => $voter->id,
    ]);
});

test('resident cannot upvote their own incident', function () {
    $estate = Estate::factory()->create();
    $reporter = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Water outage',
        'body' => 'No water in block C since 8am this morning.',
        'category' => 'water_plumbing',
    ]);

    $response = $this->actingAs($reporter)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.upvote', $incident->hashid));

    $response->assertStatus(403);
});

test('resident cannot upvote a closed incident', function () {
    $estate = Estate::factory()->create();
    $reporter = User::factory()->create();
    $voter = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $voter->assignRole('resident');
    $voter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Resolved noise issue',
        'body' => 'Resolved noise issue description.',
        'category' => 'noise_disturbance',
        'status' => IncidentStatus::Closed,
    ]);

    $response = $this->actingAs($voter)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.upvote', $incident->hashid));

    $response->assertStatus(403);
});
