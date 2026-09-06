<?php

use App\Actions\Admin\BulkInviteResidentsAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Invitation;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->residentRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    $this->securityRole = Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);

    foreach (['residents.view', 'residents.create', 'security.view', 'security.create'] as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        $this->adminRole->givePermissionTo($permission);
    }

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->adminAssignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => Plan::first()->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);
});

it('does not skip existing security personnel when bulk inviting residents and assigns resident role', function () {
    // 1. Create a security user in the estate
    $securityUser = User::factory()->create(['email' => 'security.guard@example.com']);
    setPermissionsTeamId($this->estate->id);
    $securityUser->assignRole('security');
    $this->estate->users()->attach($securityUser->id, [
        'status' => 'accepted',
        'relationship_type' => 'security',
    ]);

    AdministrativeAssignment::create([
        'user_id' => $securityUser->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->securityRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    // 2. Perform bulk invite as estate admin including the security user's email
    $this->actingAs($this->admin);
    session(['active_context_assignment_id' => $this->adminAssignment->id]);

    $emails = ['security.guard@example.com', 'brand.new.resident@example.com'];
    $result = app(BulkInviteResidentsAction::class)->execute($emails, $this->estate);

    expect($result['invited'])->toBe(2);
    expect($result['skipped'])->toBe(0);

    // 3. Verify security user now has the resident role assignment
    setPermissionsTeamId($this->estate->id);
    expect($securityUser->fresh()->hasRole('resident'))->toBeTrue();

    // Verify administrative assignment for resident exists
    expect(AdministrativeAssignment::where('user_id', $securityUser->id)
        ->where('estate_id', $this->estate->id)
        ->where('role_id', $this->residentRole->id)
        ->exists()
    )->toBeTrue();

    // Verify security role assignment is still preserved
    expect(AdministrativeAssignment::where('user_id', $securityUser->id)
        ->where('estate_id', $this->estate->id)
        ->where('role_id', $this->securityRole->id)
        ->exists()
    )->toBeTrue();

    // Verify pending invitation was created
    expect(Invitation::withoutGlobalScopes()
        ->where('email', 'security.guard@example.com')
        ->where('estate_id', $this->estate->id)
        ->where('relationship_type', 'resident')
        ->exists()
    )->toBeTrue();
});

it('skips user if they are already an accepted resident in the estate', function () {
    // Create an accepted resident
    $residentUser = User::factory()->create(['email' => 'existing.resident@example.com']);
    setPermissionsTeamId($this->estate->id);
    $residentUser->assignRole('resident');
    $this->estate->users()->attach($residentUser->id, [
        'status' => 'accepted',
        'relationship_type' => 'resident',
    ]);

    AdministrativeAssignment::create([
        'user_id' => $residentUser->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->residentRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $this->actingAs($this->admin);
    session(['active_context_assignment_id' => $this->adminAssignment->id]);

    $emails = ['existing.resident@example.com', 'brand.new2@example.com'];
    $result = app(BulkInviteResidentsAction::class)->execute($emails, $this->estate);

    expect($result['invited'])->toBe(1);
    expect($result['skipped'])->toBe(1);
});
