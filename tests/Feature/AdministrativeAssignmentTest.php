<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->action = app(CreateAdministrativeAssignmentAction::class);
    $this->user = User::factory()->create();
    $this->estate = Estate::factory()->create();

    // Add valid membership
    EstateMembership::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estate->id,
        'status' => 'accepted',
    ]);

    $this->estateRole = Role::create([
        'name' => 'custom-role',
        'guard_name' => 'web',
        'estate_id' => $this->estate->id,
    ]);
});

it('creates valid estate scoped assignment', function () {
    $assignment = $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Estate
    );

    expect($assignment->id)->not->toBeNull()
        ->and($assignment->scope_type)->toBe(AssignmentScope::Estate)
        ->and($assignment->zone_id)->toBeNull();
});

it('creates valid zone scoped assignment', function () {
    $zone = Zone::create(['name' => 'Zone 1', 'estate_id' => $this->estate->id]);

    $assignment = $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Zone,
        $zone
    );

    expect($assignment->id)->not->toBeNull()
        ->and($assignment->scope_type)->toBe(AssignmentScope::Zone)
        ->and($assignment->zone_id)->toBe($zone->id);
});

it('rejects global role injection', function () {
    $globalRole = Role::create(['name' => 'global-admin', 'guard_name' => 'web']);

    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $globalRole,
        AssignmentScope::Estate
    ))->toThrow(ValidationException::class, 'Global roles cannot be used');
});

it('rejects cross estate role injection', function () {
    $estateB = Estate::factory()->create();
    $roleB = Role::create(['name' => 'role-b', 'guard_name' => 'web', 'estate_id' => $estateB->id]);

    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $roleB,
        AssignmentScope::Estate
    ))->toThrow(ValidationException::class, 'Role does not belong to the given estate');
});

it('rejects estate scope with zone', function () {
    $zone = Zone::create(['name' => 'Zone 1', 'estate_id' => $this->estate->id]);

    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Estate,
        $zone
    ))->toThrow(ValidationException::class, 'Zone must be null for estate scope');
});

it('rejects zone scope without zone', function () {
    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Zone
    ))->toThrow(ValidationException::class, 'Zone is required for zone scope');
});

it('rejects zone escape from another estate', function () {
    $estateB = Estate::factory()->create();
    $zoneB = Zone::create(['name' => 'Zone B', 'estate_id' => $estateB->id]);

    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Zone,
        $zoneB
    ))->toThrow(ValidationException::class, 'Zone does not belong to the given estate');
});

it('rejects assignment for non member', function () {
    $nonMember = User::factory()->create();

    expect(fn () => $this->action->execute(
        $nonMember,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Estate
    ))->toThrow(ValidationException::class, 'User is not a verified member');
});

it('prevents multiple active primary assignments', function () {
    $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Estate,
        null,
        true, // isPrimary
        true  // isActive
    );

    $role2 = Role::create(['name' => 'role-2', 'guard_name' => 'web', 'estate_id' => $this->estate->id]);

    // Attempt second primary assignment
    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $role2,
        AssignmentScope::Estate,
        null,
        true, // isPrimary
        true  // isActive
    ))->toThrow(ValidationException::class, 'User already has an active primary assignment');
});

it('prevents duplicate estate assignment', function () {
    $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Estate
    );

    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Estate
    ))->toThrow(ValidationException::class, 'This administrative assignment already exists');

    // Also test DB level unique constraint
    expect(fn () => AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->estateRole->id,
        'scope_type' => 'estate',
    ]))->toThrow(Exception::class);
});

it('prevents duplicate zone assignment', function () {
    $zone = Zone::create(['name' => 'Zone 1', 'estate_id' => $this->estate->id]);

    $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Zone,
        $zone
    );

    expect(fn () => $this->action->execute(
        $this->user,
        $this->estate,
        $this->estateRole,
        AssignmentScope::Zone,
        $zone
    ))->toThrow(ValidationException::class, 'This administrative assignment already exists');

    // Also test DB level unique constraint
    expect(fn () => AdministrativeAssignment::create([
        'user_id' => $this->user->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->estateRole->id,
        'scope_type' => 'zone',
        'zone_id' => $zone->id,
    ]))->toThrow(Exception::class);
});

it('backfills safely from model_has_roles', function () {
    $user2 = User::factory()->create();
    EstateMembership::create(['user_id' => $user2->id, 'estate_id' => $this->estate->id, 'status' => 'accepted']);

    $globalRole = Role::create(['name' => 'global', 'guard_name' => 'web']);
    $role3 = Role::create(['name' => 'role-3', 'guard_name' => 'web', 'estate_id' => $this->estate->id]);

    // Valid Spatie assignment
    DB::table('model_has_roles')->insert([
        'role_id' => $this->estateRole->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estate->id,
    ]);

    // Global role assignment (should be skipped)
    DB::table('model_has_roles')->insert([
        'role_id' => $globalRole->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estate->id,
    ]);

    // Cross estate assignment (should be skipped)
    $estateB = Estate::factory()->create();
    DB::table('model_has_roles')->insert([
        'role_id' => $role3->id,
        'model_type' => User::class,
        'model_id' => $user2->id,
        'estate_id' => $estateB->id,
    ]);

    $exitCode = Artisan::call('kontrol:backfill-administrative-assignments');

    expect($exitCode)->toBe(0);

    // Only 1 assignment should be migrated
    expect(AdministrativeAssignment::count())->toBe(1);

    $assignment = AdministrativeAssignment::first();
    expect($assignment->user_id)->toBe($this->user->id)
        ->and($assignment->role_id)->toBe($this->estateRole->id)
        ->and($assignment->estate_id)->toBe($this->estate->id)
        ->and($assignment->scope_type)->toBe(AssignmentScope::Estate);

    // Test Idempotency
    Artisan::call('kontrol:backfill-administrative-assignments');
    expect(AdministrativeAssignment::count())->toBe(1);
});
