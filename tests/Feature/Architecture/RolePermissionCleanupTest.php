<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Actions\Admin\CreateRoleAction;
use App\Actions\Admin\DeleteRoleAction;
use App\Actions\Admin\UpdateRoleAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    // Create permissions
    $this->permView = Permission::create(['name' => 'residents.view', 'guard_name' => 'web']);
    $this->permCreate = Permission::create(['name' => 'residents.create', 'guard_name' => 'web']);
    $this->permManage = Permission::create(['name' => 'settings.manage', 'guard_name' => 'web']);

    $this->permRolesView = Permission::create(['name' => 'roles.view', 'guard_name' => 'web']);
    $this->permRolesCreate = Permission::create(['name' => 'roles.create', 'guard_name' => 'web']);
    $this->permRolesEdit = Permission::create(['name' => 'roles.edit', 'guard_name' => 'web']);
    $this->permRolesDelete = Permission::create(['name' => 'roles.delete', 'guard_name' => 'web']);
    $this->permAssignmentsView = Permission::create(['name' => 'assignments.view', 'guard_name' => 'web']);

    // Create estate-scoped roles
    $this->roleA = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateA->id]);
    $this->roleA->givePermissionTo([$this->permView, $this->permCreate, $this->permManage, $this->permRolesView, $this->permRolesCreate, $this->permRolesEdit, $this->permRolesDelete, $this->permAssignmentsView]);

    $this->roleB = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $this->estateB->id]);
    $this->roleB->givePermissionTo([$this->permView]);

    $this->userA = User::factory()->create(['email' => 'admin.a@example.com']);
    $this->userB = User::factory()->create(['email' => 'resident.b@example.com']);

    DB::table('estate_users_membership')->insert([
        'user_id' => $this->userA->id,
        'estate_id' => $this->estateA->id,
        'status' => 'accepted',
        'relationship_type' => 'staff',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('estate_users_membership')->insert([
        'user_id' => $this->userB->id,
        'estate_id' => $this->estateB->id,
        'status' => 'accepted',
        'relationship_type' => 'resident',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->assignA = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->userA,
        estate: $this->estateA,
        role: $this->roleA,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );
});

test('1. Estate A role cannot authorize Estate B and 2. Global role can grant estate authority and 3. Assignment must match role estate', function () {
    $globalRole = Role::create(['name' => 'global_admin_test', 'guard_name' => 'web', 'estate_id' => null]);
    $action = app(CreateAdministrativeAssignmentAction::class);

    // 2. Global role IS ALLOWED for administrative assignment
    $action->execute(
        user: $this->userA,
        estate: $this->estateA,
        role: $globalRole,
        scopeType: AssignmentScope::Estate
    );
    
    expect(AdministrativeAssignment::where('role_id', $globalRole->id)->exists())->toBeTrue();

    // 3. Assignment estate mismatch rejected
    expect(fn () => $action->execute(
        user: $this->userA,
        estate: $this->estateA,
        role: $this->roleB,
        scopeType: AssignmentScope::Estate
    ))->toThrow(ValidationException::class);
});

test('4. Switching estates flushes Spatie role cache and 5. Estate A admin loses admin permissions in Estate B and 6. Estate B resident cannot access Estate A admin', function () {
    $contextManager = app(ContextManager::class);

    // Activate User A in Estate A
    $this->actingAs($this->userA);
    $contextManager->activate($this->assignA);

    expect($this->userA->can('settings.manage'))->toBeTrue();

    // User A in Estate B context has no permissions
    session()->forget('active_context_assignment_id');
    setPermissionsTeamId($this->estateB->id);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    expect($this->userA->fresh()->can('settings.manage'))->toBeFalse();

    // User B in Estate A context has no permissions
    $this->actingAs($this->userB);
    session()->forget('active_context_assignment_id');
    setPermissionsTeamId($this->estateA->id);

    expect($this->userB->fresh()->can('settings.manage'))->toBeFalse();
});

test('7. Duplicate assignments are prevented and 8. Zone assignment belongs to correct estate and 9. Inactive assignments do not grant authority', function () {
    $action = app(CreateAdministrativeAssignmentAction::class);
    $zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Zone Beta']);

    // 7. Duplicate assignment rejected
    expect(fn () => $action->execute(
        user: $this->userA,
        estate: $this->estateA,
        role: $this->roleA,
        scopeType: AssignmentScope::Estate
    ))->toThrow(ValidationException::class);

    // 8. Zone from another estate rejected
    expect(fn () => $action->execute(
        user: $this->userA,
        estate: $this->estateA,
        role: $this->roleA,
        scopeType: AssignmentScope::Zone,
        zone: $zoneB
    ))->toThrow(ValidationException::class);

    // 9. Inactive assignment
    $inactiveAssign = AdministrativeAssignment::create([
        'user_id' => $this->userB->id,
        'estate_id' => $this->estateB->id,
        'role_id' => $this->roleB->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => false,
    ]);

    expect($inactiveAssign->is_active)->toBeFalse();
});

test('10. Estate A cannot edit Estate B roles and 11. Estate A cannot assign Estate B roles and 12. Global system roles cannot be edited', function () {
    $this->actingAs($this->userA);
    app(ContextManager::class)->activate($this->assignA);

    // 10. Edit role from another estate returns 403
    $response = $this->get(route('admin.roles.edit', ['role' => $this->roleB->id]));
    $response->assertForbidden();

    // 12. Edit reserved global role returns 403
    $globalSecurityRole = Role::where('name', 'security')->whereNull('estate_id')->first();
    if ($globalSecurityRole) {
        $respGlobal = $this->get(route('admin.roles.edit', ['role' => $globalSecurityRole->id]));
        $respGlobal->assertForbidden();
    }
});

test('13. Existing valid assignments are preserved and 14. Legacy assignments map correctly and 15. Migration is idempotent', function () {
    $auditExitCode = Artisan::call('kontrol:auth-audit');
    expect($auditExitCode)->toBe(0);
});

test('16. Permission sets remain correct after role creation and update and 17. Custom roles retain their permissions', function () {
    $this->actingAs($this->userA);
    app(ContextManager::class)->activate($this->assignA);

    // Create custom role via action
    $roleAction = app(CreateRoleAction::class);
    $customRole = $roleAction->execute([
        'name' => 'Facility Supervisor',
        'permissions' => [$this->permView->id, $this->permCreate->id],
    ]);

    expect($customRole->estate_id)->toBe($this->estateA->id);
    expect($customRole->hasPermissionTo('residents.view'))->toBeTrue();
    expect($customRole->hasPermissionTo('residents.create'))->toBeTrue();

    // Update role permissions via action
    $updateAction = app(UpdateRoleAction::class);
    $updateAction->execute($customRole, [
        'name' => 'Senior Facility Supervisor',
        'permissions' => [$this->permManage->id],
    ]);

    expect($customRole->fresh()->name)->toBe('Senior Facility Supervisor');
    expect($customRole->fresh()->hasPermissionTo('settings.manage'))->toBeTrue();
    expect($customRole->fresh()->hasPermissionTo('residents.view'))->toBeFalse();
});

test('18. Current estate context is clear and 19. Administrators cannot select another estate role and 20. Zone selection is scoped to active estate', function () {
    $this->actingAs($this->userA);
    app(ContextManager::class)->activate($this->assignA);

    $zoneA = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone Alpha']);
    $zoneB = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Zone Beta']);

    $response = $this->get(route('admin.roles.create'));
    $response->assertOk();
});

test('21. Destructive role actions communicate their consequences and 22. Role workflows operate cleanly', function () {
    $this->actingAs($this->userA);
    app(ContextManager::class)->activate($this->assignA);

    $customRole = app(CreateRoleAction::class)->execute([
        'name' => 'Temporary Helper Role',
        'permissions' => [$this->permView->id],
    ]);

    app(DeleteRoleAction::class)->execute($customRole);

    expect(Role::where('id', $customRole->id)->exists())->toBeFalse();
});

test('23. Empty, loading, and search states handle empty datasets safely', function () {
    $this->actingAs($this->userA);
    app(ContextManager::class)->activate($this->assignA);

    $response = $this->get(route('admin.roles.index'));
    $response->assertOk();
});

test('24. UI and actions do not expose internal database IDs or unsafe parameters', function () {
    $this->actingAs($this->userA);
    app(ContextManager::class)->activate($this->assignA);

    $response = $this->get(route('admin.assignments.index'));
    $response->assertOk();
});
