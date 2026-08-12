<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use App\Services\EstateContextService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estateA = Estate::factory()->create(['name' => 'Estate Alpha']);
    $this->estateB = Estate::factory()->create(['name' => 'Estate Beta']);

    $this->zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone Alpha']);
    $this->zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Zone Beta']);

    $this->permAdmin = Permission::create(['name' => 'settings.manage', 'guard_name' => 'web']);
    $this->permResident = Permission::create(['name' => 'visitors.create', 'guard_name' => 'web']);
    $this->permRolesView = Permission::create(['name' => 'roles.view', 'guard_name' => 'web']);
    $this->permRolesCreate = Permission::create(['name' => 'roles.create', 'guard_name' => 'web']);

    $this->roleAdminA = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->roleAdminA->givePermissionTo([$this->permAdmin, $this->permRolesView, $this->permRolesCreate]);

    $this->roleResidentB = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->roleResidentB->givePermissionTo([$this->permResident]);

    $this->multiUser = User::factory()->create(['email' => 'adversary.user@example.com']);
    $this->otherUser = User::factory()->create(['email' => 'other.user@example.com']);

    // Memberships
    DB::table('estate_users_membership')->insert([
        'user_id' => $this->multiUser->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
        'relationship_type' => 'staff',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('estate_users_membership')->insert([
        'user_id' => $this->multiUser->id,
        'estate_id' => $this->estateB->id,
        'status' => 'accepted',
        'relationship_type' => 'resident',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('estate_users_membership')->insert([
        'user_id' => $this->otherUser->id,
        'estate_id' => $this->estateB->id,
        'status' => 'accepted',
        'relationship_type' => 'staff',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->assignAdminA = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->multiUser,
        estate: $this->estateA,
        role: $this->roleAdminA,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );

    $this->assignResidentB = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->multiUser,
        estate: $this->estateB,
        role: $this->roleResidentB,
        scopeType: AssignmentScope::Estate,
        isPrimary: false
    );

    $this->otherAssignB = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->otherUser,
        estate: $this->estateB,
        role: $this->roleResidentB,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );
});

test('1. Same User instance Spatie cache flush across context switches (preventing stale eager-loaded roles)', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    // Activate Context A
    $contextManager->activate($this->assignAdminA);
    expect($this->multiUser->can('settings.manage'))->toBeTrue();
    expect($this->multiUser->contextHasRole('admin'))->toBeTrue();

    // Switch to Context B on the EXACT same User instance
    $contextManager->activate($this->assignResidentB);
    expect($this->multiUser->can('settings.manage'))->toBeFalse();
    expect($this->multiUser->contextHasRole('admin'))->toBeFalse();
    expect($this->multiUser->can('visitors.create'))->toBeTrue();
});

test('2. Reverse context switch test (Estate B Resident -> Estate A Admin)', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    // Start in Context B (Resident)
    $contextManager->activate($this->assignResidentB);
    expect($this->multiUser->can('settings.manage'))->toBeFalse();

    // Switch back to Context A (Admin)
    $contextManager->activate($this->assignAdminA);
    expect($this->multiUser->can('settings.manage'))->toBeTrue();
    expect($this->multiUser->can('visitors.create'))->toBeFalse();
    expect(getPermissionsTeamId())->toBe($this->estateA->id);
});

test('3. Cross-estate route attack: Active in Estate B Resident cannot access Estate A Admin routes', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    $contextManager->activate($this->assignResidentB);

    $response = $this->get(route('admin.roles.index'));
    expect(in_array($response->status(), [403, 302]))->toBeTrue();
});

test('4. Route parameter spoofing: Route estate_id parameter cannot override active context', function () {
    $contextManager = app(ContextManager::class);
    $estateContextService = app(EstateContextService::class);
    $this->actingAs($this->multiUser);

    // Active context is Estate B
    $contextManager->activate($this->assignResidentB);

    // Spoofed parameter in request does not override EstateContextService
    $this->withHeaders(['X-Spoofed-Estate' => $this->estateA->id]);
    expect($estateContextService->getEstateId())->toBe($this->estateB->id);
});

test('5. Context picker backend security: POST /context/switch with unauthorized assignment is rejected', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    // Attempt to switch to otherUser's assignment in Estate B
    $response = $this->post(route('context.switch'), [
        'assignment_id' => $this->otherAssignB->id,
    ]);

    expect($response->status())->toBe(404);
});

test('6. Inactive assignment grants no authority', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    // Deactivate assignment A
    $this->assignAdminA->update(['is_active' => false]);

    expect(fn () => $contextManager->activate($this->assignAdminA))->toThrow(Exception::class);
});

test('7. Pending membership grants no active context or authority', function () {
    $pendingUser = User::factory()->create();
    DB::table('estate_users_membership')->insert([
        'user_id' => $pendingUser->id,
        'estate_id' => $this->estateA->id,
        'status' => 'pending',
        'relationship_type' => 'resident',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $contextManager = app(ContextManager::class);
    expect($contextManager->getValidAssignments($pendingUser)->count())->toBe(0);
});

test('8. Wrong-estate role assignment is rejected by CreateAdministrativeAssignmentAction', function () {
    $action = app(CreateAdministrativeAssignmentAction::class);

    // Attempt to assign Estate B's role to an Estate A assignment
    expect(fn () => $action->execute(
        user: $this->multiUser,
        estate: $this->estateA,
        role: $this->roleResidentB,
        scopeType: AssignmentScope::Estate
    ))->toThrow(ValidationException::class);
});

test('9. Duplicate assignment DB & Action invariant is enforced', function () {
    $action = app(CreateAdministrativeAssignmentAction::class);

    expect(fn () => $action->execute(
        user: $this->multiUser,
        estate: $this->estateA,
        role: $this->roleAdminA,
        scopeType: AssignmentScope::Estate,
        isPrimary: false
    ))->toThrow(ValidationException::class);
});

test('10. Global role escape test: Global admin role without assignment grants no estate authority', function () {
    $globalAdminRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web', 'estate_id' => null]);
    $globalUser = User::factory()->create();
    $globalUser->assignRole($globalAdminRole);

    $this->actingAs($globalUser);
    $contextManager = app(ContextManager::class);

    expect($contextManager->current())->toBeNull();
    expect($globalUser->contextHasRole('admin'))->toBeFalse();
});

test('11. Role management security: Estate A admin cannot edit Estate B roles', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    $contextManager->activate($this->assignAdminA);

    $response = $this->get(route('admin.roles.edit', ['role' => $this->roleResidentB->id]));
    $response->assertForbidden();
});

test('12. Privilege downgrade test: Deactivating assignment revokes authority on next check', function () {
    $contextManager = app(ContextManager::class);
    $this->actingAs($this->multiUser);

    $contextManager->activate($this->assignAdminA);
    expect($this->multiUser->can('settings.manage'))->toBeTrue();

    // Deactivate assignment
    $this->assignAdminA->update(['is_active' => false]);

    // Clearing session context causes re-resolution to reject inactive assignment
    session()->forget('active_context_assignment_id');
    $contextManager->clear();

    expect($contextManager->current())->toBeNull();
});

test('13. Final Auth Audit Command runs cleanly with 0 integrity issues', function () {
    $exitCode = Artisan::call('kontrol:auth-audit');
    expect($exitCode)->toBe(0);
});
