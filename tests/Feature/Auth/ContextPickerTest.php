<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Greenview Estate']);
    $this->estateB = Estate::factory()->create(['name' => 'Lakeside Estate']);

    $this->user = User::factory()->create(['name' => 'Test User']);

    $this->estateA->users()->attach($this->user->id, ['status' => 'accepted']);
    $this->estateB->users()->attach($this->user->id, ['status' => 'accepted']);

    $this->adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->residentRole = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->securityRole = Role::create(['name' => 'security', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);

    Permission::create(['name' => 'admin.access', 'guard_name' => 'web']);
    $this->adminRole->givePermissionTo('admin.access');

    setPermissionsTeamId($this->estateA->id);
    $this->user->assignRole($this->adminRole);

    setPermissionsTeamId($this->estateB->id);
    $this->user->assignRole($this->residentRole);

    $this->assignmentA = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->assignmentB = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->residentRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
});

test('0 active contexts renders AccessDenied view', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('context.select'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Auth/AccessDenied'));
});

test('1 active context auto-activates and redirects to target portal', function () {
    $user = User::factory()->create();
    $estate = Estate::factory()->create();
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $role = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => $role->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->get(route('context.select'));

    $response->assertRedirect(route('admin.dashboard'));
    expect(session('active_context_assignment_id'))->toBe($assignment->id);
});

test('2+ active contexts renders ContextPicker page with available contexts', function () {
    $response = $this->actingAs($this->user)->get(route('context.select'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Auth/ContextPicker')
        ->has('availableContexts', 2)
    );
});

test('POST /context/switch with valid assignment activates context and updates session', function () {
    $response = $this->actingAs($this->user)->post(route('context.switch'), [
        'assignment_id' => $this->assignmentB->id,
    ]);

    $response->assertRedirect(route('resident.dashboard'));
    expect(session('active_context_assignment_id'))->toBe($this->assignmentB->id);
});

test('POST /context/switch with assignment of another user is rejected', function () {
    $otherUser = User::factory()->create();
    $otherEstate = Estate::factory()->create();
    $otherUser->estates()->attach($otherEstate->id, ['status' => 'accepted']);
    $otherRole = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $otherEstate->id]);

    $otherAssignment = AdministrativeAssignment::create([
        'user_id' => $otherUser->id,
        'estate_id' => $otherEstate->id,
        'role_id' => $otherRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)->post(route('context.switch'), [
        'assignment_id' => $otherAssignment->id,
    ]);

    $response->assertNotFound();
    expect(session('active_context_assignment_id'))->toBeNull();
});

test('POST /context/switch with inactive assignment is rejected', function () {
    $this->assignmentA->update(['is_active' => false]);

    $response = $this->actingAs($this->user)->post(route('context.switch'), [
        'assignment_id' => $this->assignmentA->id,
    ]);

    $response->assertNotFound();
    expect(session('active_context_assignment_id'))->toBeNull();
});

test('POST /context/switch with invalid zone scope is rejected', function () {
    $otherEstate = Estate::factory()->create();
    $invalidZone = Zone::create([
        'estate_id' => $otherEstate->id,
        'name' => 'Zone Foreign',
    ]);

    $invalidAssignment = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->securityRole->id,
        'zone_id' => $invalidZone->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)->post(route('context.switch'), [
        'assignment_id' => $invalidAssignment->id,
    ]);

    $response->assertStatus(403);
});

test('switching context clears Spatie permissions and role relations', function () {
    $this->actingAs($this->user);

    // Activate Admin context on Estate A
    $this->post(route('context.switch'), ['assignment_id' => $this->assignmentA->id]);
    expect(getPermissionsTeamId())->toBe($this->estateA->id);

    // Switch to Resident context on Estate B
    $this->post(route('context.switch'), ['assignment_id' => $this->assignmentB->id]);
    expect(getPermissionsTeamId())->toBe($this->estateB->id);
    expect(auth()->user()->hasRole('admin'))->toBeFalse();
    expect(auth()->user()->hasRole('resident'))->toBeTrue();
});
