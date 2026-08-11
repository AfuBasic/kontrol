<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use App\Auth\ContextManager;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    
    // Create estates
    $this->estateA = Estate::factory()->create(['name' => 'Estate A']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate B']);
    $this->estateC = Estate::factory()->create(['name' => 'Estate C']);
    
    // Attach memberships
    $this->user->estates()->attach([
        $this->estateA->id => ['status' => 'accepted'],
        $this->estateB->id => ['status' => 'accepted'],
        $this->estateC->id => ['status' => 'accepted'],
    ]);
    
    // Setup roles
    $this->adminRoleA = Role::create(['name' => 'admin', 'estate_id' => $this->estateA->id]);
    $this->residentRoleB = Role::create(['name' => 'resident', 'estate_id' => $this->estateB->id]);
    
    // Setup Administrative Assignments
    $this->assignmentA = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
    
    $this->assignmentB = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->residentRoleB->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
    
    // Assign roles manually in DB for the legacy test assertions
    DB::table('model_has_roles')->insert([
        'role_id' => $this->adminRoleA->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
    ]);
    
    DB::table('model_has_roles')->insert([
        'role_id' => $this->residentRoleB->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estateB->id,
    ]);
});

it('Test 1 — Admin -> Resident prevents eager load leak', function () {
    $this->actingAs($this->user);
    
    // Activate Estate A (Admin)
    session(['active_context_assignment_id' => $this->assignmentA->id]);
    app(ContextManager::class)->resolve(request());
    
    expect(Auth::user()->roles()->where('name', 'admin')->exists())->toBeTrue()
        ->and(Auth::user()->roles()->where('name', 'resident')->exists())->toBeFalse();
        
    // Switch to Estate B (Resident)
    session(['active_context_assignment_id' => $this->assignmentB->id]);
    app(ContextManager::class)->resolve(request());
    
    expect(Auth::user()->roles()->where('name', 'admin')->exists())->toBeFalse()
        ->and(Auth::user()->roles()->where('name', 'resident')->exists())->toBeTrue();
});

it('Test 2 — Resident -> Admin prevents eager load leak', function () {
    $this->actingAs($this->user);
    
    // Activate Estate B (Resident)
    session(['active_context_assignment_id' => $this->assignmentB->id]);
    app(ContextManager::class)->resolve(request());
    
    expect(Auth::user()->roles()->where('name', 'resident')->exists())->toBeTrue()
        ->and(Auth::user()->roles()->where('name', 'admin')->exists())->toBeFalse();
        
    // Switch to Estate A (Admin)
    session(['active_context_assignment_id' => $this->assignmentA->id]);
    app(ContextManager::class)->resolve(request());
    
    expect(Auth::user()->roles()->where('name', 'resident')->exists())->toBeFalse()
        ->and(Auth::user()->roles()->where('name', 'admin')->exists())->toBeTrue();
});

it('Test 3 — Unauthorized Context Selection is rejected', function () {
    $this->actingAs($this->user);
    
    // Assignment C does not belong to the user
    $otherUser = User::factory()->create();
    $assignmentC = AdministrativeAssignment::create([
        'user_id' => $otherUser->id,
        'estate_id' => $this->estateC->id,
        'role_id' => $this->adminRoleA->id, // Fake role match
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
    
    $response = $this->post(route('context.switch'), [
        'assignment_id' => $assignmentC->id,
    ]);
    
    $response->assertStatus(404); // firstOrFail throws 404 when user_id scope fails
    
    // Context should remain unchanged/null
    expect(session('active_context_assignment_id'))->toBeNull();
});

it('Test 4 — Multiple Context Login does not auto-activate first estate', function () {
    $user = User::factory()->create();
    $user->estates()->attach([$this->estateA->id => ['status' => 'accepted'], $this->estateB->id => ['status' => 'accepted']]);
    $assignA = AdministrativeAssignment::create(['user_id' => $user->id, 'estate_id' => $this->estateA->id, 'role_id' => $this->adminRoleA->id, 'scope_type' => AssignmentScope::Estate, 'is_active' => true]);
    $assignB = AdministrativeAssignment::create(['user_id' => $user->id, 'estate_id' => $this->estateB->id, 'role_id' => $this->residentRoleB->id, 'scope_type' => AssignmentScope::Estate, 'is_active' => true]);
    
    $action = app(\App\Actions\Auth\ActivateContext::class);
    // Passing null for assignment when trying to login without explicit choice
    $redirectUrl = $action->execute($user, null);
    
    expect($redirectUrl)->toBe(route('context.select'));
    expect(session('active_context_assignment_id'))->toBeNull();
});

it('Test 5 — Single Context Login automatically activates', function () {
    $user = User::factory()->create();
    $user->estates()->attach($this->estateA->id, ['status' => 'accepted']);
    $assignment = AdministrativeAssignment::create(['user_id' => $user->id, 'estate_id' => $this->estateA->id, 'role_id' => $this->adminRoleA->id, 'scope_type' => AssignmentScope::Estate, 'is_active' => true]);
    
    $this->actingAs($user);
    $action = app(\App\Actions\Auth\ActivateContext::class);
    $redirectUrl = $action->execute($user, null);
    
    expect($redirectUrl)->not->toBe(route('context.select'));
    expect(session('active_context_assignment_id'))->toBe($assignment->id);
});

it('Test 6 — No Context denies entry', function () {
    $user = User::factory()->create();
    // No assignments
    
    $action = app(\App\Actions\Auth\ActivateContext::class);
    $redirectUrl = $action->execute($user, null);
    
    expect($redirectUrl)->toBe(url('/'));
    expect(session('active_context_assignment_id'))->toBeNull();
});

it('Test 7 — Route Parameter Spoofing uses active context', function () {
    $this->actingAs($this->user);
    
    // Active context is Estate A
    session(['active_context_assignment_id' => $this->assignmentA->id]);
    
    // Try to access Estate B's route
    // The middleware expects the session to be resolved
    $request = \Illuminate\Http\Request::create('/admin/some-route', 'GET', ['estate_id' => $this->estateB->id]);
    $request->setLaravelSession(session()->driver());
    $request->setUserResolver(fn() => $this->user);
    app(ContextManager::class)->resolve($request);
    
    $middleware = app(\App\Http\Middleware\ValidateEstateContext::class);
    
    $exception = null;
    try {
        $middleware->handle($request, fn() => new \Illuminate\Http\Response());
    } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
        $exception = $e;
    }
    
    expect($exception)->not->toBeNull()
        ->and($exception->getStatusCode())->toBe(403)
        ->and($exception->getMessage())->toContain('Estate ID mismatch');
});

it('Test 8 — Global Role Must Not Control Routing', function () {
    // The user has admin on Estate A, and resident on Estate B.
    $this->actingAs($this->user);
    
    // Activate resident context on Estate B
    session(['active_context_assignment_id' => $this->assignmentB->id]);
    
    // Try to access /admin route
    $request = \Illuminate\Http\Request::create('/admin/dashboard', 'GET');
    $request->setLaravelSession(session()->driver());
    $request->setUserResolver(fn() => $this->user);
    app(ContextManager::class)->resolve($request);
    
    $middleware = app(\App\Http\Middleware\ValidateEstateContext::class);
    
    $exception = null;
    try {
        $middleware->handle($request, fn() => new \Illuminate\Http\Response());
    } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
        $exception = $e;
    }
    
    expect($exception)->not->toBeNull()
        ->and($exception->getStatusCode())->toBe(403)
        ->and($exception->getMessage())->toContain('Admin context required');
});
