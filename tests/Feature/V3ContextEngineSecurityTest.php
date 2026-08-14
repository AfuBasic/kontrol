<?php

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->contextManager = app(ContextManager::class);
});

it('Test 1 — prevents Spatie cache leakage across context switches', function () {
    // Setup
    $user = User::factory()->create();

    $estateA = Estate::factory()->create();
    $estateB = Estate::factory()->create();

    EstateMembership::create(['user_id' => $user->id, 'estate_id' => $estateA->id, 'status' => 'accepted']);
    EstateMembership::create(['user_id' => $user->id, 'estate_id' => $estateB->id, 'status' => 'accepted']);

    $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
    $residentRole = Role::create(['name' => 'resident', 'guard_name' => 'web']);

    $assignmentA = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estateA->id,
        'role_id' => $adminRole->id,
        'is_active' => true,
    ]);

    $assignmentB = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estateB->id,
        'role_id' => $residentRole->id,
        'is_active' => true,
    ]);

    // Spatie internal relation
    $user->roles()->attach($adminRole->id, ['estate_id' => $estateA->id, 'model_type' => User::class]);
    $user->roles()->attach($residentRole->id, ['estate_id' => $estateB->id, 'model_type' => User::class]);

    // Activate Context A
    $this->actingAs($user);
    $this->contextManager->activate($assignmentA);
    $requestA = Request::create('/test');
    $requestA->setLaravelSession(Session::driver());
    $requestA->setUserResolver(fn () => $user);

    $this->contextManager->resolve($requestA);

    // Load caches explicitly
    $user->getAllPermissions();
    expect($user->hasRole('admin'))->toBeTrue();

    // Now switch to Context B
    $this->contextManager->activate($assignmentB);
    $requestB = Request::create('/test');
    $requestB->setLaravelSession(Session::driver());
    $requestB->setUserResolver(fn () => $user);

    $this->contextManager->resolve($requestB);

    // The vulnerability test: does user still have admin role because of caching?
    expect($user->hasRole('admin'))->toBeFalse();
    expect($user->hasRole('resident'))->toBeTrue();
});

it('Test 2 — rejects forged context', function () {
    $user = User::factory()->create();
    $estateA = Estate::factory()->create();

    // Assignment for someone else
    $otherUser = User::factory()->create();
    $role = Role::create(['name' => 'resident', 'guard_name' => 'web']);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $otherUser->id,
        'estate_id' => $estateA->id,
        'role_id' => $role->id,
        'is_active' => true,
    ]);

    $this->actingAs($user);

    Session::put('active_context_assignment_id', $assignment->id);

    $request = Request::create('/test');
    $request->setLaravelSession(Session::driver());
    $request->setUserResolver(fn () => $user);

    $context = $this->contextManager->resolve($request);

    expect($context)->toBeNull();
});

it('Test 3 — rejects inactive assignment', function () {
    $user = User::factory()->create();
    $estate = Estate::factory()->create();
    EstateMembership::create(['user_id' => $user->id, 'estate_id' => $estate->id, 'status' => 'accepted']);

    $role = Role::create(['name' => 'resident', 'guard_name' => 'web']);
    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => $role->id,
        'is_active' => false, // Inactive!
    ]);

    $this->actingAs($user);
    expect(fn () => $this->contextManager->activate($assignment))->toThrow(Exception::class);
});

it('Test 4 — rejects wrong estate role', function () {
    $user = User::factory()->create();
    $estateA = Estate::factory()->create();
    $estateB = Estate::factory()->create();
    EstateMembership::create(['user_id' => $user->id, 'estate_id' => $estateA->id, 'status' => 'accepted']);

    // Create a role strictly bound to estate B
    $role = Role::create(['name' => 'custom', 'guard_name' => 'web', 'estate_id' => $estateB->id]);

    // Try to assign it in Estate A
    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estateA->id,
        'role_id' => $role->id,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    expect(fn () => $this->contextManager->activate($assignment))->toThrow(Exception::class);
});

it('Test 5 — rejects wrong zone', function () {
    $user = User::factory()->create();
    $estateA = Estate::factory()->create();
    $estateB = Estate::factory()->create();
    EstateMembership::create(['user_id' => $user->id, 'estate_id' => $estateA->id, 'status' => 'accepted']);

    $role = Role::create(['name' => 'security', 'guard_name' => 'web']);
    $zoneInB = Zone::create(['estate_id' => $estateB->id, 'name' => 'South Gate']);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estateA->id,
        'role_id' => $role->id,
        'zone_id' => $zoneInB->id,
        'is_active' => true,
    ]);

    $this->actingAs($user);
    expect(fn () => $this->contextManager->activate($assignment))->toThrow(Exception::class);
});

it('Test 6 — rejects activating someone elses assignment', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $estate = Estate::factory()->create();
    EstateMembership::create(['user_id' => $userB->id, 'estate_id' => $estate->id, 'status' => 'accepted']);

    $role = Role::create(['name' => 'resident', 'guard_name' => 'web']);
    $assignmentForB = AdministrativeAssignment::create([
        'user_id' => $userB->id,
        'estate_id' => $estate->id,
        'role_id' => $role->id,
        'is_active' => true,
    ]);

    // User A attempts to activate User B's assignment
    $this->actingAs($userA);
    expect(fn () => $this->contextManager->activate($assignmentForB))->toThrow(Exception::class);
});

it('Test 7 — safe failure with no context', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $request = Request::create('/test');
    $request->setLaravelSession(Session::driver());
    $request->setUserResolver(fn () => $user);

    $context = $this->contextManager->resolve($request);

    expect($context)->toBeNull();
});

it('Test 8 — handles invalid session data safely', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Session::put('active_context_assignment_id', 'invalid_string_not_an_id');

    $request = Request::create('/test');
    $request->setLaravelSession(Session::driver());
    $request->setUserResolver(fn () => $user);

    $context = $this->contextManager->resolve($request);

    expect($context)->toBeNull();
});
