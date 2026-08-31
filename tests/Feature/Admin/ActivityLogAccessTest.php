<?php

use App\Enums\AssignmentScope;
use App\Models\Activity;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('admin can view activity logs', function () {
    $estate = Estate::factory()->create();
    $admin = User::factory()->create(['email_verified_at' => now()]);
    $estate->users()->attach($admin->id, ['status' => 'accepted']);

    $role = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    $viewPerm = Permission::firstOrCreate(['name' => 'activity_logs.view', 'guard_name' => 'web']);
    $role->givePermissionTo($viewPerm);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $admin->id,
        'estate_id' => $estate->id,
        'role_id' => $role->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
        'is_primary' => true,
    ]);

    setPermissionsTeamId($estate->id);
    $admin->assignRole($role);

    Activity::create([
        'estate_id' => $estate->id,
        'causer_type' => User::class,
        'causer_id' => $admin->id,
        'description' => 'Created a test record',
        'log_name' => 'default',
    ]);

    $this->actingAs($admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.activity-log.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/ActivityLog/Index')
            ->has('activities.data', 1));
});

test('user with custom role having activity_logs.view permission can view activity logs', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create(['email_verified_at' => now()]);
    $estate->users()->attach($user->id, ['status' => 'accepted']);

    $customRole = Role::create(['name' => 'auditor', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    $viewPerm = Permission::firstOrCreate(['name' => 'activity_logs.view', 'guard_name' => 'web']);
    $customRole->givePermissionTo($viewPerm);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => $customRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
        'is_primary' => true,
    ]);

    setPermissionsTeamId($estate->id);
    $user->assignRole($customRole);

    Activity::create([
        'estate_id' => $estate->id,
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'description' => 'Auditor test entry',
        'log_name' => 'default',
    ]);

    $this->actingAs($user)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.activity-log.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/ActivityLog/Index')
            ->has('activities.data', 1));
});

test('user with custom role without activity_logs.view permission gets 403', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create(['email_verified_at' => now()]);
    $estate->users()->attach($user->id, ['status' => 'accepted']);

    $customRole = Role::create(['name' => 'guard_supervisor', 'guard_name' => 'web', 'estate_id' => $estate->id]);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => $customRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
        'is_primary' => true,
    ]);

    setPermissionsTeamId($estate->id);
    $user->assignRole($customRole);

    $this->actingAs($user)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.activity-log.index'))
        ->assertForbidden();
});
