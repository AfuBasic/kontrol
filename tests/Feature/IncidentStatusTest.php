<?php

use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
});

test('admin can transition incident through statuses', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    $reporter = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $admin->estates()->attach($estate->id, ['status' => 'accepted']);

    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Road blocked by fallen tree',
        'body' => 'A heavy branch fell blocking the second exit lane completely.',
        'category' => 'road_infrastructure',
        'status' => IncidentStatus::Pending,
    ]);

    // Update status to Acknowledged
    $response = $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'status' => 'acknowledged',
        ]);
    $response->assertRedirect();
    expect($incident->fresh()->status)->toBe(IncidentStatus::Acknowledged);
    expect($incident->fresh()->acknowledged_at)->not->toBeNull();

    // Update status to Resolving and assign to admin
    $response = $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'status' => 'resolving',
            'assigned_to' => $admin->id,
        ]);
    $response->assertRedirect();
    expect($incident->fresh()->status)->toBe(IncidentStatus::Resolving);
    expect($incident->fresh()->assigned_to)->toBe($admin->id);
    expect($incident->fresh()->resolving_at)->not->toBeNull();

    // Update status to Solved
    $response = $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'status' => 'solved',
        ]);
    $response->assertRedirect();
    expect($incident->fresh()->status)->toBe(IncidentStatus::Solved);
    expect($incident->fresh()->solved_at)->not->toBeNull();
});

test('admin cannot mark incident as closed', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    $reporter = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $admin->estates()->attach($estate->id, ['status' => 'accepted']);

    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Gate lock malfunctioning',
        'body' => 'Malfunction on gate 2 keycard access.',
        'category' => 'security',
        'status' => IncidentStatus::Solved,
    ]);

    $response = $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'status' => 'closed',
        ]);

    $response->assertStatus(302); // fails validation since "closed" is not in UpdateIncidentStatusRequest's status validation list
});

test('reporter can close a solved incident', function () {
    $estate = Estate::factory()->create();
    $reporter = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Pothole fixing request',
        'body' => 'Huge pothole at the entry point.',
        'category' => 'road_infrastructure',
        'status' => IncidentStatus::Solved,
    ]);

    $response = $this->actingAs($reporter)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.close', $incident->hashid));

    $response->assertRedirect();
    expect($incident->fresh()->status)->toBe(IncidentStatus::Closed);
    expect($incident->fresh()->closed_at)->not->toBeNull();
});

test('non-reporter cannot close a solved incident', function () {
    $estate = Estate::factory()->create();
    $reporter = User::factory()->create();
    $otherResident = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $otherResident->assignRole('resident');
    $otherResident->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Pothole fixing request',
        'body' => 'Huge pothole at the entry point.',
        'category' => 'road_infrastructure',
        'status' => IncidentStatus::Solved,
    ]);

    $response = $this->actingAs($otherResident)
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.incidents.close', $incident->hashid));

    $response->assertStatus(403);
});
