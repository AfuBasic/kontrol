<?php

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    // Estate A
    $this->estateA = Estate::factory()->create();
    $this->user->estates()->attach($this->estateA->id, ['status' => 'accepted']);
    $this->roleAdminA = Role::create(['name' => 'admin', 'estate_id' => $this->estateA->id, 'guard_name' => 'web']);
    $this->permissionAdminA = Permission::create(['name' => 'admin-only', 'guard_name' => 'web']);
    $this->roleAdminA->givePermissionTo($this->permissionAdminA);

    $this->assignmentAdminA = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateA->id,
        'role_id' => $this->roleAdminA->id,
        'is_primary' => true,
        'is_active' => true,
    ]);

    // Estate B
    $this->estateB = Estate::factory()->create();
    $this->user->estates()->attach($this->estateB->id, ['status' => 'accepted']);
    $this->roleResidentB = Role::create(['name' => 'resident', 'estate_id' => $this->estateB->id, 'guard_name' => 'web']);
    $this->permissionResidentB = Permission::create(['name' => 'resident-only', 'guard_name' => 'web']);
    $this->roleResidentB->givePermissionTo($this->permissionResidentB);

    $this->assignmentResidentB = AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->roleResidentB->id,
        'is_primary' => false,
        'is_active' => true,
    ]);

    // Give Spatie roles (simulating the backfill/assignment logic output)
    setPermissionsTeamId($this->estateA->id);
    $this->user->assignRole($this->roleAdminA);

    setPermissionsTeamId($this->estateB->id);
    $this->user->assignRole($this->roleResidentB);

    // Create a global role
    $this->globalRole = Role::create(['name' => 'global-admin', 'estate_id' => null, 'guard_name' => 'web']);

    $this->contextManager = app(ContextManager::class);
    Auth::login($this->user);

    $this->makeRequest = function () {
        $request = Request::create('/', 'GET');
        $request->setLaravelSession($this->app['session']->driver());
        $request->setUserResolver(fn () => $this->user);

        return $request;
    };
});

it('Test 1 - Admin to Resident: revokes Admin permissions', function () {
    // Act as Admin in Estate A
    $this->contextManager->activate($this->assignmentAdminA);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextHasRole('admin'))->toBeTrue();
    expect($this->user->contextCan('admin-only'))->toBeTrue();

    // Switch context to Estate B
    $this->contextManager->activate($this->assignmentResidentB);
    $this->contextManager->resolve(($this->makeRequest)());

    // Admin permissions from Estate A should be revoked in the context of Estate B
    expect($this->user->contextHasRole('admin'))->toBeFalse();
    expect($this->user->contextCan('admin-only'))->toBeFalse();
    expect($this->user->contextHasRole('resident'))->toBeTrue();
});

it('Test 2 - Resident to Admin: grants Admin permissions', function () {
    // Act as Resident in Estate B
    $this->contextManager->activate($this->assignmentResidentB);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextHasRole('admin'))->toBeFalse();

    // Switch context to Estate A
    $this->contextManager->activate($this->assignmentAdminA);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextHasRole('admin'))->toBeTrue();
    expect($this->user->contextCan('admin-only'))->toBeTrue();
});

it('Test 3 - No stale permissions', function () {
    $this->contextManager->activate($this->assignmentAdminA);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextCan('admin-only'))->toBeTrue();

    $this->contextManager->activate($this->assignmentResidentB);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextCan('admin-only'))->toBeFalse();
});

it('Test 4 - No stale roles', function () {
    $this->contextManager->activate($this->assignmentAdminA);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextHasRole('admin'))->toBeTrue();

    $this->contextManager->activate($this->assignmentResidentB);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextHasRole('admin'))->toBeFalse();
});

it('Test 5 - Global role injection fails against Context', function () {
    // Attempt to inject a global role into Spatie
    setPermissionsTeamId($this->estateB->id); // Pretend we give it to them here
    $this->user->assignRole($this->globalRole);

    $this->contextManager->activate($this->assignmentResidentB);
    $this->contextManager->resolve(($this->makeRequest)());

    // The active context assignment is 'resident', not 'global-admin'
    // The resolver must reject this even though Spatie has the role.
    expect($this->user->contextHasRole('global-admin'))->toBeFalse();
});

it('Test 6 - Wrong-estate assignment fails', function () {
    // Manually mess up the database to simulate a bad assignment
    $this->assignmentResidentB->update(['estate_id' => $this->estateA->id]);

    try {
        $this->contextManager->activate($this->assignmentResidentB);
    } catch (Exception $e) {
        // Expected
    }

    // Simulate invalid assignment already in session
    session(['active_context_assignment_id' => $this->assignmentResidentB->id]);
    $this->contextManager->resolve(($this->makeRequest)());

    // In this invalid state, context manager resolution might clear the session
    // so no role should be resolvable.
    expect($this->user->contextHasRole('resident'))->toBeFalse();
});

it('Test 7 - Inactive assignment fails', function () {
    $this->assignmentAdminA->update(['is_active' => false]);

    // Activation might throw exception based on our ContextManager isValid logic
    // Let's test the resolver directly with a bypassed activation (simulating it becoming inactive mid-session)
    session(['active_context_assignment_id' => $this->assignmentAdminA->id]);
    $this->contextManager->resolve(($this->makeRequest)());

    expect($this->user->contextHasRole('admin'))->toBeFalse();
});

it('Test 8 - Route spoofing fails', function () {
    // User is active in Estate A
    $this->contextManager->activate($this->assignmentAdminA);
    $this->contextManager->resolve(($this->makeRequest)());

    // Try to access Estate B's resident role
    expect($this->user->contextHasRole('resident'))->toBeFalse();

    // Even if route contained Estate B, ContextManager->current()->estateId points to Estate A
    expect($this->contextManager->current()->estateId)->toBe($this->estateA->id);
});
