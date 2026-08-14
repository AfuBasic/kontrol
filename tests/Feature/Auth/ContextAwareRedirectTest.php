<?php

use App\Actions\Auth\ActivateContext;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\MagicLoginToken;
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
    $this->residentRoleB = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->securityRoleA = Role::create(['name' => 'security', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
});

test('Test 1 - Admin only user routes to Admin Portal', function () {
    $user = User::factory()->create();
    $this->estateA->users()->attach($user->id, ['status' => 'accepted']);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    $action = app(ActivateContext::class);
    $redirectUrl = $action->execute($user);

    expect($redirectUrl)->toBe(route('admin.dashboard'));
    expect(session('active_context_assignment_id'))->toBe($assignment->id);
});

test('Test 2 - Resident only user routes to Resident Portal', function () {
    $user = User::factory()->create();
    $this->estateB->users()->attach($user->id, ['status' => 'accepted']);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->residentRoleB->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    $action = app(ActivateContext::class);
    $redirectUrl = $action->execute($user);

    expect($redirectUrl)->toBe(route('resident.dashboard'));
    expect(session('active_context_assignment_id'))->toBe($assignment->id);
});

test('Test 3 - Security only user routes to Security Portal', function () {
    $user = User::factory()->create();
    $this->estateA->users()->attach($user->id, ['status' => 'accepted']);
    $zone = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone 1']);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->securityRoleA->id,
        'zone_id' => $zone->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    $action = app(ActivateContext::class);
    $redirectUrl = $action->execute($user);

    expect($redirectUrl)->toBe(route('security.dashboard'));
    expect(session('active_context_assignment_id'))->toBe($assignment->id);
});

test('Test 4 - Admin + Resident across estates routes based on active context', function () {
    $user = User::factory()->create();
    $this->estateA->users()->attach($user->id, ['status' => 'accepted']);
    $this->estateB->users()->attach($user->id, ['status' => 'accepted']);

    $assignA = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $assignB = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->residentRoleB->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    $action = app(ActivateContext::class);

    // Activate Estate A context
    $urlA = $action->execute($user, $assignA);
    expect($urlA)->toBe(route('admin.dashboard'));
    expect(session('active_context_assignment_id'))->toBe($assignA->id);

    // Activate Estate B context
    $urlB = $action->execute($user, $assignB);
    expect($urlB)->toBe(route('resident.dashboard'));
    expect(session('active_context_assignment_id'))->toBe($assignB->id);
});

test('Test 5 - Same estate, different contexts changes destination correctly', function () {
    $user = User::factory()->create();
    $this->estateA->users()->attach($user->id, ['status' => 'accepted']);

    $assignAdmin = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $assignSec = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->securityRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    $action = app(ActivateContext::class);

    // Activate Admin assignment
    expect($action->execute($user, $assignAdmin))->toBe(route('admin.dashboard'));

    // Switch to Security assignment
    expect($action->execute($user, $assignSec))->toBe(route('security.dashboard'));
});

test('Test 6 - No active context with 2+ assignments sends user to Context Picker', function () {
    $user = User::factory()->create();
    $this->estateA->users()->attach($user->id, ['status' => 'accepted']);
    $this->estateB->users()->attach($user->id, ['status' => 'accepted']);

    AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->residentRoleB->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    $action = app(ActivateContext::class);
    $redirectUrl = $action->execute($user, null);

    expect($redirectUrl)->toBe(route('context.select'));
    expect(session('active_context_assignment_id'))->toBeNull();
});

test('Test 7 - Stale context is handled gracefully', function () {
    $user = User::factory()->create();
    $this->estateA->users()->attach($user->id, ['status' => 'accepted']);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    session(['active_context_assignment_id' => $assignment->id]);

    // Deactivate the assignment mid-session
    $assignment->update(['is_active' => false]);

    // ContextManager should return null and forget session key
    $resolvedContext = app(ContextManager::class)->resolve();
    expect($resolvedContext)->toBeNull();
    expect(session('active_context_assignment_id'))->toBeNull();
});

test('Test 8 - Magic login controller routes fallback to context.select', function () {
    $user = User::factory()->create();
    $magicToken = MagicLoginToken::create([
        'user_id' => $user->id,
        'token' => 'test-magic-token-123',
        'expires_at' => now()->addMinutes(15),
        'destination_url' => null,
    ]);

    $url = URL::signedRoute('auth.magic-login', ['token' => 'test-magic-token-123']);
    $response = $this->get($url);

    $response->assertRedirect(route('context.select'));
});
