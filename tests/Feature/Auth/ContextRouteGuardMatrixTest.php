<?php

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Http\Middleware\ValidateEstateContext;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Estate A']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate B']);

    $this->adminRoleA = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->residentRoleB = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->securityRoleA = Role::create(['name' => 'security', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);

    $this->user = User::factory()->create();

    $this->estateA->users()->attach($this->user->id, ['status' => 'accepted']);
    $this->estateB->users()->attach($this->user->id, ['status' => 'accepted']);

    setPermissionsTeamId($this->estateA->id);
    $this->user->assignRole($this->adminRoleA);
    $this->user->assignRole($this->securityRoleA);

    setPermissionsTeamId($this->estateB->id);
    $this->user->assignRole($this->residentRoleB);

    $this->assignAdminA = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->adminRoleA->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->assignResidentB = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->residentRoleB->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
});

test('Test A - Admin in Estate A is ALLOWED on Admin routes when Estate A active, DENIED on Admin routes when Estate B Resident active', function () {
    $this->actingAs($this->user);

    // Active: Estate A (Admin)
    session(['active_context_assignment_id' => $this->assignAdminA->id]);
    app(ContextManager::class)->resolve();

    $responseA = $this->get(route('admin.dashboard'));
    $responseA->assertOk();

    // Active: Estate B (Resident) - Admin route access is denied/redirected away from admin
    session(['active_context_assignment_id' => $this->assignResidentB->id]);
    app(ContextManager::class)->resolve();

    $responseB = $this->get(route('admin.dashboard'));
    $responseB->assertRedirect(route('resident.home'));
});

test('Test B - Resident in Estate B is ALLOWED on Resident routes when Estate B active', function () {
    $this->actingAs($this->user);

    session(['active_context_assignment_id' => $this->assignResidentB->id]);
    app(ContextManager::class)->resolve();

    $response = $this->get(route('resident.home'));
    $response->assertOk();
});

test('Test C - Security in Zone A is ALLOWED on Security routes', function () {
    $zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);
    $assignSecZoneA = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->securityRoleA->id,
        'zone_id' => $zoneA->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    $this->actingAs($this->user);
    session(['active_context_assignment_id' => $assignSecZoneA->id]);
    app(ContextManager::class)->resolve();

    $response = $this->get(route('security.home'));
    $response->assertOk();
});

test('Test D - Security in Zone A context cannot access Zone B scoped records', function () {
    $zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A']);
    $zoneB = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone B']);

    $assignSecZoneA = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->securityRoleA->id,
        'zone_id' => $zoneA->id,
        'scope_type' => AssignmentScope::Zone,
        'is_active' => true,
    ]);

    $incidentA = Incident::create([
        'estate_id' => $this->estateA->id,
        'zone_id' => $zoneA->id,
        'reporter_id' => $this->user->id,
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
        'reporter_id' => $this->user->id,
        'reporter_type' => User::class,
        'source' => 'security_report',
        'title' => 'Zone B Incident',
        'body' => 'Body',
        'category' => 'security',
        'priority' => 'high',
        'status' => 'pending',
    ]);

    $this->actingAs($this->user);
    session(['active_context_assignment_id' => $assignSecZoneA->id]);
    app(ContextManager::class)->resolve();

    // Querying Incident under Zone A context should exclude Zone B record
    $incidents = Incident::all();
    expect($incidents->pluck('id')->contains($incidentA->id))->toBeTrue();
    expect($incidents->pluck('id')->contains($incidentB->id))->toBeFalse();
});

test('Test E - Route estate parameter mismatch is DENIED', function () {
    $this->actingAs($this->user);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    $request = Request::create('/admin/dashboard', 'GET', ['estate_id' => $this->estateB->id]);
    $request->setLaravelSession(session()->driver());
    $request->setUserResolver(fn () => $this->user);
    app(ContextManager::class)->resolve($request);

    $middleware = app(ValidateEstateContext::class);
    $exception = null;

    try {
        $middleware->handle($request, fn () => new Response);
    } catch (HttpException $e) {
        $exception = $e;
    }

    expect($exception)->not->toBeNull();
    expect($exception->getStatusCode())->toBe(403);
    expect($exception->getMessage())->toContain('Estate ID mismatch');
});

test('Test F - No active context is DENIED access to protected routes', function () {
    $unauthenticatedUser = User::factory()->create();

    $response = $this->actingAs($unauthenticatedUser)->get(route('admin.dashboard'));
    $response->assertStatus(403);
});

test('Test G - Stale context is DENIED access', function () {
    $this->actingAs($this->user);
    session(['active_context_assignment_id' => $this->assignAdminA->id]);

    // Deactivate assignment
    $this->assignAdminA->update(['is_active' => false]);

    $response = $this->get(route('admin.dashboard'));
    $response->assertRedirect(route('resident.home'));
});

test('Test H - Switching context from Admin to Resident clears role cache and revokes Admin access', function () {
    $this->actingAs($this->user);

    // Context A (Admin)
    session(['active_context_assignment_id' => $this->assignAdminA->id]);
    app(ContextManager::class)->resolve();
    expect(auth()->user()->hasRole('admin'))->toBeTrue();

    // Context B (Resident)
    session(['active_context_assignment_id' => $this->assignResidentB->id]);
    app(ContextManager::class)->resolve();

    expect(auth()->user()->hasRole('admin'))->toBeFalse();
    expect(auth()->user()->hasRole('resident'))->toBeTrue();

    $response = $this->get(route('admin.dashboard'));
    $response->assertRedirect(route('resident.home'));
});
