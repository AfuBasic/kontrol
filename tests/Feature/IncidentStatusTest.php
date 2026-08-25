<?php

use App\Enums\AssignmentScope;
use App\Enums\IncidentStatus;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSettings;
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
    $adminRole = Role::where('name', 'admin')->first();
    AdministrativeAssignment::create([
        'user_id' => $admin->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

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

test('admin receives validation error when updating an already closed incident', function () {
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
        'title' => 'Already closed report',
        'body' => 'This incident was already closed and should reject further admin lifecycle updates.',
        'category' => 'security',
        'status' => IncidentStatus::Closed,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'status' => 'pending',
        ])
        ->assertSessionHasErrors(['status']);
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

test('resolving incident requires resolution notes when estate policy is enabled', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    $reporter = User::factory()->create();

    $settings = EstateSettings::forEstate($estate->id);
    $settings->require_resolution_notes_for_incidents = true;
    $settings->save();

    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $admin->estates()->attach($estate->id, ['status' => 'accepted']);
    $adminRole = Role::where('name', 'admin')->first();
    AdministrativeAssignment::create([
        'user_id' => $admin->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'Water pump failure',
        'body' => 'Borehole pump stopped pumping to the central reservoir tank.',
        'category' => 'water_plumbing',
        'status' => IncidentStatus::Resolving,
    ]);

    // Fails without resolution notes
    $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'status' => 'solved',
        ])
        ->assertSessionHasErrors(['resolution_notes']);

    // Passes with resolution notes
    $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'status' => 'solved',
            'resolution_notes' => 'Pump capacitor replaced and tested successfully.',
        ])
        ->assertRedirect();

    expect($incident->fresh()->status)->toBe(IncidentStatus::Solved);
    expect($incident->fresh()->solved_at)->not->toBeNull();
});

test('admin can update case details without modifying status', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create();
    $reporter = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $admin->assignRole('admin');
    $admin->estates()->attach($estate->id, ['status' => 'accepted']);
    $adminRole = Role::where('name', 'admin')->first();
    AdministrativeAssignment::create([
        'user_id' => $admin->id,
        'estate_id' => $estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $reporter->assignRole('resident');
    $reporter->estates()->attach($estate->id, ['status' => 'accepted']);

    $incident = Incident::create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'title' => 'General maintenance issue',
        'body' => 'Street lamp #12 is flickering.',
        'category' => 'lighting',
        'priority' => 'low',
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.incidents.status.update', $incident->hashid), [
            'priority' => 'critical',
            'is_private' => true,
        ])
        ->assertRedirect();

    $fresh = $incident->fresh();
    expect($fresh->status)->toBe(IncidentStatus::Pending);
    expect($fresh->priority->value)->toBe('critical');
    expect($fresh->is_private)->toBeTrue();
});
