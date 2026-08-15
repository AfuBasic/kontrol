<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Actions\Admin\DeactivateAdministrativeAssignmentAction;
use App\Actions\Admin\UpdateAdministrativeAssignmentAction;
use App\Auth\ActiveContext;
use App\Auth\AuthorizationResolver;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\FeatureSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $this->seed(FeatureSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->otherEstate = Estate::factory()->create();

    $this->adminRole = Role::create([
        'name' => 'admin',
        'guard_name' => 'web',
        'estate_id' => $this->estate->id,
    ]);

    $this->staffRole = Role::create([
        'name' => 'staff',
        'guard_name' => 'web',
        'estate_id' => $this->estate->id,
    ]);

    $this->securityRole = Role::create([
        'name' => 'security',
        'guard_name' => 'web',
        'estate_id' => $this->estate->id,
    ]);

    $this->otherEstateRole = Role::create([
        'name' => 'admin',
        'guard_name' => 'web',
        'estate_id' => $this->otherEstate->id,
    ]);

    $this->globalRole = Role::create([
        'name' => 'global-security',
        'guard_name' => 'web',
        'estate_id' => null,
    ]);

    $this->admin = User::factory()->create();
    EstateMembership::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'status' => 'accepted',
    ]);

    $this->member = User::factory()->create();
    EstateMembership::create([
        'user_id' => $this->member->id,
        'estate_id' => $this->estate->id,
        'status' => 'accepted',
    ]);

    $this->createAction = app(CreateAdministrativeAssignmentAction::class);

    $this->adminAssignment = $this->createAction->execute(
        user: $this->admin,
        estate: $this->estate,
        role: $this->adminRole,
        scopeType: AssignmentScope::Estate,
        isPrimary: true,
    );

    Permission::create(['name' => 'assignments.view']);
    Permission::create(['name' => 'assignments.create']);
    Permission::create(['name' => 'assignments.edit']);
    Permission::create(['name' => 'assignments.delete']);

    $this->adminRole->givePermissionTo(['assignments.view', 'assignments.create', 'assignments.edit', 'assignments.delete']);
    $this->otherEstateRole->givePermissionTo(['assignments.view', 'assignments.create', 'assignments.edit', 'assignments.delete']);

    $this->zoneA = Zone::create(['name' => 'Zone A', 'estate_id' => $this->estate->id]);
    $this->zoneB = Zone::create(['name' => 'Zone B', 'estate_id' => $this->estate->id]);
    $this->foreignZone = Zone::create(['name' => 'Foreign Zone', 'estate_id' => $this->otherEstate->id]);
});

function actingAsAdminWithContext(): mixed
{
    return test()->actingAs(test()->admin)
        ->withSession(['active_context_assignment_id' => test()->adminAssignment->id]);
}

it('creates an estate-scoped assignment for a member', function () {
    $assignment = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    expect($assignment->estate_id)->toBe($this->estate->id)
        ->and($assignment->role_id)->toBe($this->staffRole->id)
        ->and($assignment->scope_type)->toBe(AssignmentScope::Estate)
        ->and($assignment->zone_id)->toBeNull()
        ->and($assignment->is_active)->toBeTrue();

    app(ContextManager::class)->setSystemContext($this->estate->id, $this->member);
    expect($this->member->hasRole('staff'))->toBeTrue();
});

it('allows global Spatie roles on assignment create', function () {
    $assignment = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->globalRole,
        scopeType: AssignmentScope::Estate,
    );
    expect($assignment)->toBeInstanceOf(AdministrativeAssignment::class);
});

it('requires assignment estate to match role estate', function () {
    expect(fn () => $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->otherEstateRole,
        scopeType: AssignmentScope::Estate,
    ))->toThrow(ValidationException::class, 'Role does not belong to the given estate');
});

it('rejects estate scope with a zone', function () {
    expect(fn () => $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
        zone: $this->zoneA,
    ))->toThrow(ValidationException::class, 'Zone must be null for estate scope');
});

it('requires a zone for zone-scoped assignments', function () {
    expect(fn () => $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->securityRole,
        scopeType: AssignmentScope::Zone,
    ))->toThrow(ValidationException::class, 'Zone is required for zone scope');
});

it('rejects zones belonging to another estate', function () {
    expect(fn () => $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->securityRole,
        scopeType: AssignmentScope::Zone,
        zone: $this->foreignZone,
    ))->toThrow(ValidationException::class, 'Zone does not belong to the given estate');
});

it('rejects duplicate assignments', function () {
    $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    expect(fn () => $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    ))->toThrow(ValidationException::class, 'This administrative assignment already exists');
});

it('allows the same role on different zones for one user', function () {
    $a = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->securityRole,
        scopeType: AssignmentScope::Zone,
        zone: $this->zoneA,
    );

    $b = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->securityRole,
        scopeType: AssignmentScope::Zone,
        zone: $this->zoneB,
    );

    expect($a->id)->not->toBe($b->id)
        ->and($a->zone_id)->toBe($this->zoneA->id)
        ->and($b->zone_id)->toBe($this->zoneB->id);
});

it('does not authorize through inactive assignments', function () {
    $assignment = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    app(DeactivateAdministrativeAssignmentAction::class)->execute($assignment);

    $this->actingAs($this->member);
    session(['active_context_assignment_id' => $assignment->id]);

    $context = app(ContextManager::class)->resolve();
    expect($context)->toBeNull();

    // Even if a stale context were forced, AuthorizationResolver must fail on inactive.
    $reflection = new ReflectionClass(ContextManager::class);
    $property = $reflection->getProperty('currentContext');
    $property->setAccessible(true);
    $property->setValue(app(ContextManager::class), new ActiveContext(
        userId: $this->member->id,
        estateId: $this->estate->id,
        assignmentId: $assignment->id,
        roleId: $this->staffRole->id,
        zoneId: null,
    ));

    expect(app(AuthorizationResolver::class)->hasRole('staff', $this->member))->toBeFalse();
});

it('lets estate admins list assignments for the current estate', function () {
    $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    actingAsAdminWithContext()
        ->get(route('admin.assignments.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Assignments/Index')
            ->has('assignments.data', 2)
        );
});

it('lets estate admins create assignments via HTTP', function () {
    actingAsAdminWithContext()
        ->post(route('admin.assignments.store'), [
            'user_id' => $this->member->id,
            'role_ids' => [$this->staffRole->id],
            'scope_type' => 'estate',
            'is_primary' => false,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.assignments.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('administrative_assignments', [
        'user_id' => $this->member->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->staffRole->id,
        'scope_type' => 'estate',
        'is_active' => true,
    ]);
});

it('lets estate admins update role and scope', function () {
    $assignment = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    actingAsAdminWithContext()
        ->put(route('admin.assignments.update', $assignment), [
            'role_ids' => [$this->securityRole->id],
            'scope_type' => 'zone',
            'zone_id' => $this->zoneA->id,
            'is_primary' => false,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.assignments.index'));

    $assignment->refresh();

    expect($assignment->role_id)->toBe($this->securityRole->id)
        ->and($assignment->scope_type)->toBe(AssignmentScope::Zone)
        ->and($assignment->zone_id)->toBe($this->zoneA->id);
});

it('lets estate admins deactivate without deleting', function () {
    $assignment = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    actingAsAdminWithContext()
        ->post(route('admin.assignments.deactivate', $assignment))
        ->assertRedirect();

    $assignment->refresh();

    expect($assignment->exists)->toBeTrue()
        ->and($assignment->is_active)->toBeFalse();
});

it('forbids managing assignments outside the active estate context', function () {
    $foreignUser = User::factory()->create();
    EstateMembership::create([
        'user_id' => $foreignUser->id,
        'estate_id' => $this->otherEstate->id,
        'status' => 'accepted',
    ]);

    $foreignAssignment = AdministrativeAssignment::create([
        'user_id' => $foreignUser->id,
        'estate_id' => $this->otherEstate->id,
        'role_id' => $this->otherEstateRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    actingAsAdminWithContext()
        ->put(route('admin.assignments.update', $foreignAssignment), [
            'role_ids' => [$this->staffRole->id],
            'scope_type' => 'estate',
            'is_active' => false,
        ])
        ->assertForbidden();

    actingAsAdminWithContext()
        ->post(route('admin.assignments.deactivate', $foreignAssignment))
        ->assertForbidden();
});

it('rejects HTTP create when role belongs to another estate', function () {
    actingAsAdminWithContext()
        ->from(route('admin.assignments.create'))
        ->post(route('admin.assignments.store'), [
            'user_id' => $this->member->id,
            'role_ids' => [$this->otherEstateRole->id],
            'scope_type' => 'estate',
        ])
        ->assertSessionHasErrors('role_ids.0');
});

it('rejects HTTP create when zone belongs to another estate', function () {
    actingAsAdminWithContext()
        ->from(route('admin.assignments.create'))
        ->post(route('admin.assignments.store'), [
            'user_id' => $this->member->id,
            'role_ids' => [$this->securityRole->id],
            'scope_type' => 'zone',
            'zone_id' => $this->foreignZone->id,
        ])
        ->assertSessionHasErrors('zone_id');
});

it('clears active context when the current assignment is deactivated', function () {
    $this->actingAs($this->admin);
    session(['active_context_assignment_id' => $this->adminAssignment->id]);
    app(ContextManager::class)->resolve();

    expect(app(ContextManager::class)->current())->not->toBeNull();

    app(DeactivateAdministrativeAssignmentAction::class)->execute($this->adminAssignment);

    expect(session('active_context_assignment_id'))->toBeNull()
        ->and(app(ContextManager::class)->current())->toBeNull();
});

it('keeps ContextManager working after assignment updates', function () {
    $assignment = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    app(UpdateAdministrativeAssignmentAction::class)->execute($assignment, [
        'role_id' => $this->securityRole->id,
        'scope_type' => AssignmentScope::Zone->value,
        'zone_id' => $this->zoneA->id,
        'is_active' => true,
    ]);

    $this->actingAs($this->member);
    session(['active_context_assignment_id' => $assignment->id]);

    $context = app(ContextManager::class)->resolve();

    expect($context)->not->toBeNull()
        ->and($context->estateId)->toBe($this->estate->id)
        ->and($context->assignmentId)->toBe($assignment->id)
        ->and($context->zoneId)->toBe($this->zoneA->id)
        ->and(app(AuthorizationResolver::class)->hasRole('security', $this->member))->toBeTrue()
        ->and(app(AuthorizationResolver::class)->hasRole('staff', $this->member))->toBeFalse();
});

it('does not leak Spatie team state across estates after assignment management', function () {
    $assignment = $this->createAction->execute(
        user: $this->member,
        estate: $this->estate,
        role: $this->staffRole,
        scopeType: AssignmentScope::Estate,
    );

    EstateMembership::create([
        'user_id' => $this->member->id,
        'estate_id' => $this->otherEstate->id,
        'status' => 'accepted',
    ]);

    $otherAssignment = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->member,
        estate: $this->otherEstate,
        role: $this->otherEstateRole,
        scopeType: AssignmentScope::Estate,
    );

    $this->actingAs($this->member);

    session(['active_context_assignment_id' => $assignment->id]);
    app(ContextManager::class)->resolve();
    expect($this->member->hasRole('staff'))->toBeTrue()
        ->and($this->member->hasRole('admin'))->toBeFalse();

    session(['active_context_assignment_id' => $otherAssignment->id]);
    app(ContextManager::class)->resolve();
    expect($this->member->hasRole('admin'))->toBeTrue()
        ->and($this->member->hasRole('staff'))->toBeFalse();
});
