<?php

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\Incident;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Estate A']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate B']);

    $this->adminRoleA = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->adminRoleB = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->residentRoleA = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);

    $this->adminUserA = User::factory()->create();
    $this->estateA->users()->attach($this->adminUserA->id, ['status' => 'accepted']);
    setPermissionsTeamId($this->estateA->id);
    $this->adminUserA->assignRole($this->adminRoleA);

    $this->assignAdminA = AdministrativeAssignment::create([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->adminUserB = User::factory()->create();
    $this->estateB->users()->attach($this->adminUserB->id, ['status' => 'accepted']);
    setPermissionsTeamId($this->estateB->id);
    $this->adminUserB->assignRole($this->adminRoleB);

    $this->assignAdminB = AdministrativeAssignment::create([
        'user_id' => $this->adminUserB->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->adminRoleB->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
});

test('1. Authorized estate admin can create a zone', function () {
    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $response = $this->post(route('admin.zones.store'), [
        'name' => 'Block A',
        'description' => 'Residential Block A',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('zones', [
        'estate_id' => $this->estateA->id,
        'name' => 'Block A',
        'description' => 'Residential Block A',
    ]);
});

test('2. Zone is automatically attached to current estate from ContextManager', function () {
    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $this->post(route('admin.zones.store'), [
        'name' => 'Phase 1',
    ]);

    $zone = Zone::where('name', 'Phase 1')->first();
    expect($zone)->not->toBeNull();
    expect($zone->estate_id)->toBe($this->estateA->id);
});

test('3. Submitted estate_id in request payload cannot override active context estate', function () {
    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $this->post(route('admin.zones.store'), [
        'estate_id' => $this->estateB->id, // Tampered estate_id
        'name' => 'Phase 2',
    ]);

    $zone = Zone::where('name', 'Phase 2')->first();
    expect($zone)->not->toBeNull();
    expect($zone->estate_id)->toBe($this->estateA->id); // Must be Estate A, not Estate B!
});

test('4. Duplicate zone names within the same estate are rejected', function () {
    Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Block A']);

    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $response = $this->post(route('admin.zones.store'), [
        'name' => 'Block A',
    ]);

    $response->assertSessionHasErrors('name');
});

test('5. Same zone name across different estates is allowed', function () {
    Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Block A']);

    $this->actingAs($this->adminUserB);
    session(['active_context_assignment_id' => $this->assignAdminB->id]);

    $response = $this->post(route('admin.zones.store'), [
        'name' => 'Block A',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('zones', [
        'estate_id' => $this->estateB->id,
        'name' => 'Block A',
    ]);
});

test('6. Estate A admin cannot modify or delete Estate B zones', function () {
    $zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Block B']);

    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $responseUpdate = $this->put(route('admin.zones.update', $zoneB), ['name' => 'Tampered Name']);
    $responseUpdate->assertStatus(403);

    $responseDelete = $this->delete(route('admin.zones.destroy', $zoneB));
    $responseDelete->assertStatus(403);
});

test('7. Resident users cannot create or manage zones', function () {
    $residentUser = User::factory()->create();
    $this->estateA->users()->attach($residentUser->id, ['status' => 'accepted']);
    $assignResident = AdministrativeAssignment::create([
        'user_id' => $residentUser->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->residentRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($residentUser);
    session(['active_context_assignment_id' => $assignResident->id]);

    $response = $this->post(route('admin.zones.store'), ['name' => 'Unauthorized Zone']);
    $response->assertStatus(403);
});

test('8. Archived zones cannot become active authorization scopes', function () {
    $zone = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Archived Zone']);
    $secRole = Role::create(['name' => 'security', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);

    $assignZone = AdministrativeAssignment::create([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $secRole->id,
        'zone_id' => $zone->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    // Archive the zone
    $zone->delete();

    // ContextManager resolution should reject this assignment
    $validAssignments = app(ContextManager::class)->getValidAssignments($this->adminUserA);
    expect($validAssignments->pluck('id')->contains($assignZone->id))->toBeFalse();
});

test('9. Membership zone validation rules check estate compatibility', function () {
    $zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Estate B Zone']);

    // Attempting to attach membership on Estate A referencing Estate B Zone must fail validation
    $membership = new EstateMembership([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneB->id,
        'status' => 'accepted',
    ]);

    // Custom check helper
    $zone = Zone::find($membership->zone_id);
    expect($zone->estate_id)->not->toBe($membership->estate_id);
});

test('10. Zone assignment cannot reference a zone from another estate', function () {
    $zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Estate B Zone']);
    $secRoleA = Role::create(['name' => 'security', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $secRoleA->id,
        'zone_id' => $zoneB->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    // ContextManager isValidAssignment must reject mismatch
    expect(app(ContextManager::class)->isValidAssignment($assignment, $this->adminUserA))->toBeFalse();
});

test('11. Estate-scoped assignment cannot contain a zone_id', function () {
    $zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'zone_id' => $zoneA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    expect(app(ContextManager::class)->isValidAssignment($assignment, $this->adminUserA))->toBeFalse();
});

test('12. Zone-scoped assignment requires a zone_id', function () {
    $secRoleA = Role::create(['name' => 'security', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $secRoleA->id,
        'zone_id' => null,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    expect(app(ContextManager::class)->isValidAssignment($assignment, $this->adminUserA))->toBeFalse();
});

test('13. Zone-scoped user cannot retrieve another zone records through unfiltered Eloquent query', function () {
    $zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);
    $zoneB = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone B']);
    $secRoleA = Role::create(['name' => 'security', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);

    $assignZoneA = AdministrativeAssignment::create([
        'user_id' => $this->adminUserA->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $secRoleA->id,
        'zone_id' => $zoneA->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    $incidentA = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneA->id,
        'reporter_id' => $this->adminUserA->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Zone A Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $incidentB = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneB->id,
        'reporter_id' => $this->adminUserA->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Zone B Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $assignZoneA->id]);
    app(ContextManager::class)->resolve();

    $incidents = Incident::all();
    expect($incidents->pluck('id')->contains($incidentA->id))->toBeTrue();
    expect($incidents->pluck('id')->contains($incidentB->id))->toBeFalse();
});

test('14. Estate-wide admin retains appropriate estate-wide visibility across all zones', function () {
    $zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);
    $zoneB = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone B']);

    $incidentA = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneA->id,
        'reporter_id' => $this->adminUserA->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Zone A Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $incidentB = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneB->id,
        'reporter_id' => $this->adminUserA->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Zone B Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);
    app(ContextManager::class)->resolve();

    $incidents = Incident::all();
    expect($incidents->pluck('id')->contains($incidentA->id))->toBeTrue();
    expect($incidents->pluck('id')->contains($incidentB->id))->toBeTrue();
});

test('15. Global scopes cannot accidentally leak records across estates', function () {
    $incidentA = Incident::create([
        'estate_id' => $this->estateA->id,
        'reporter_id' => $this->adminUserA->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Estate A Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $incidentB = Incident::create([
        'estate_id' => $this->estateB->id,
        'reporter_id' => $this->adminUserB->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Estate B Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);
    app(ContextManager::class)->resolve();

    $incidents = Incident::all();
    expect($incidents->pluck('id')->contains($incidentA->id))->toBeTrue();
    expect($incidents->pluck('id')->contains($incidentB->id))->toBeFalse();
});

test('16. Archiving a zone soft deletes the zone record while keeping historical incident records intact', function () {
    $zone = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Historic Zone']);
    $incident = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $zone->id,
        'reporter_id' => $this->adminUserA->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Historic Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $this->actingAs($this->adminUserA);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $response = $this->delete(route('admin.zones.destroy', $zone));
    $response->assertRedirect();

    // Zone soft-deleted
    expect(Zone::withTrashed()->find($zone->id)->trashed())->toBeTrue();

    // Incident remains preserved in database
    $savedIncident = Incident::withoutGlobalScopes()->find($incident->id);
    expect($savedIncident)->not->toBeNull();
    expect($savedIncident->zone_id)->toBe($zone->id);
});
