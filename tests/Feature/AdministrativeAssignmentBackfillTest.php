<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->estate = Estate::factory()->create();
    $this->user = User::factory()->create();

    // Accept membership
    $this->user->estates()->attach($this->estate->id, ['status' => 'accepted']);

    // Create an estate-scoped role
    $this->role = Role::create([
        'name' => 'estate_1_admin',
        'guard_name' => 'web',
        'estate_id' => $this->estate->id,
    ]);
});

it('Test 1 — Estate role migration creates administrative assignment', function () {
    // Manually insert into model_has_roles to simulate existing state
    DB::table('model_has_roles')->insert([
        'role_id' => $this->role->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estate->id,
    ]);

    $this->artisan('kontrol:backfill-administrative-assignments')
        ->expectsOutputToContain('Migrated: User '.$this->user->id)
        ->assertExitCode(0);

    $this->assertDatabaseHas('administrative_assignments', [
        'user_id' => $this->user->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->role->id,
        'scope_type' => AssignmentScope::Estate->value,
        'zone_id' => null,
    ]);
});

it('Test 2 — Global role ignored and reported', function () {
    $globalRole = Role::create([
        'name' => 'global_admin',
        'guard_name' => 'web',
        'estate_id' => null, // Global
    ]);

    DB::table('model_has_roles')->insert([
        'role_id' => $globalRole->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estate->id, // Incorrectly assigned to an estate context
    ]);

    $this->artisan('kontrol:backfill-administrative-assignments')
        ->expectsOutputToContain("Skipped: Global role 'global_admin'")
        ->assertExitCode(0);

    $this->assertDatabaseMissing('administrative_assignments', [
        'role_id' => $globalRole->id,
    ]);
});

it('Test 3 — Missing membership prevents assignment creation', function () {
    $stranger = User::factory()->create();
    // No membership attached

    DB::table('model_has_roles')->insert([
        'role_id' => $this->role->id,
        'model_type' => User::class,
        'model_id' => $stranger->id,
        'estate_id' => $this->estate->id,
    ]);

    $this->artisan('kontrol:backfill-administrative-assignments')
        ->expectsOutputToContain('does not have accepted membership')
        ->assertExitCode(0);

    $this->assertDatabaseMissing('administrative_assignments', [
        'user_id' => $stranger->id,
    ]);
});

it('Test 4 — Wrong membership prevents assignment creation', function () {
    $otherEstate = Estate::factory()->create();
    $stranger = User::factory()->create();
    $stranger->estates()->attach($otherEstate->id, ['status' => 'accepted']);

    // Assigned a role in Estate 1, but is only a member of Estate 2
    DB::table('model_has_roles')->insert([
        'role_id' => $this->role->id,
        'model_type' => User::class,
        'model_id' => $stranger->id,
        'estate_id' => $this->estate->id,
    ]);

    $this->artisan('kontrol:backfill-administrative-assignments')
        ->expectsOutputToContain('does not have accepted membership')
        ->assertExitCode(0);

    $this->assertDatabaseMissing('administrative_assignments', [
        'user_id' => $stranger->id,
    ]);
});

it('Test 5 — Idempotency', function () {
    DB::table('model_has_roles')->insert([
        'role_id' => $this->role->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estate->id,
    ]);

    // Run once
    $this->artisan('kontrol:backfill-administrative-assignments')
        ->expectsOutputToContain('Migrated:')
        ->assertExitCode(0);
    expect(AdministrativeAssignment::count())->toBe(1);

    // Run again
    $this->artisan('kontrol:backfill-administrative-assignments')
        ->expectsOutputToContain('Skipped: Assignment already exists')
        ->assertExitCode(0);

    expect(AdministrativeAssignment::count())->toBe(1);
});

it('Test 6 — Dry run mode makes no database changes', function () {
    DB::table('model_has_roles')->insert([
        'role_id' => $this->role->id,
        'model_type' => User::class,
        'model_id' => $this->user->id,
        'estate_id' => $this->estate->id,
    ]);

    $this->artisan('kontrol:backfill-administrative-assignments', ['--dry-run' => true])
        ->expectsOutputToContain('Would migrate:')
        ->assertExitCode(0);

    expect(AdministrativeAssignment::count())->toBe(0);
});

it('Test 7 — Role/estate invariant rejected by domain layer', function () {
    $otherEstate = Estate::factory()->create();
    $this->user->estates()->attach($otherEstate->id, ['status' => 'accepted']);

    $action = app(CreateAdministrativeAssignmentAction::class);

    try {
        $action->execute(
            $this->user,
            $otherEstate,
            $this->role,
            AssignmentScope::Estate,
            null,
            false,
            true
        );
        $this->fail('ValidationException was not thrown.');
    } catch (ValidationException $e) {
        expect($e->errors())->toHaveKey('role');
        expect($e->errors()['role'][0])->toBe('Role does not belong to the given estate.');
    }
});

it('Test 8 — Zone invariant', function () {
    $action = app(CreateAdministrativeAssignmentAction::class);
    $dummyZone = Zone::create(['estate_id' => $this->estate->id, 'name' => 'Zone 1']);

    try {
        $action->execute(
            $this->user,
            $this->estate,
            $this->role,
            AssignmentScope::Estate,
            $dummyZone,
            false,
            true
        );
        $this->fail('ValidationException was not thrown for Estate scope with zone.');
    } catch (ValidationException $e) {
        expect($e->errors())->toHaveKey('zone');
        expect($e->errors()['zone'][0])->toBe('Zone must be null for estate scope.');
    }

    try {
        $action->execute(
            $this->user,
            $this->estate,
            $this->role,
            AssignmentScope::Zone,
            null,
            false,
            true
        );
        $this->fail('ValidationException was not thrown for Zone scope without zone.');
    } catch (ValidationException $e) {
        expect($e->errors())->toHaveKey('zone');
        expect($e->errors()['zone'][0])->toBe('Zone is required for zone scope.');
    }
});
