<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
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
    $this->poRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);

    foreach (['residents.view', 'property_owners.view', 'property_owners.create', 'property_owners.edit'] as $permission) {
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

it('converts a resident into a property owner from the residents workspace', function () {
    $resident = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $resident->assignRole('resident');
    $this->estate->users()->attach($resident->id, [
        'status' => 'accepted',
        'property_owner_id' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->patch(route('admin.residents.mark-as-property-owner', $resident))
        ->assertRedirect()
        ->assertSessionHas('success');

    setPermissionsTeamId($this->estate->id);
    expect($resident->fresh()->hasRole('property_owner'))->toBeTrue();

    $this->assertDatabaseHas('estate_users_membership', [
        'user_id' => $resident->id,
        'estate_id' => $this->estate->id,
        'property_owner_id' => null,
    ]);
});

it('grants resident privileges to a property owner from the owners workspace', function () {
    $this->estate->settings()->update([
        'charge_type' => 'residents',
        'free_trial_enabled' => true,
        'free_trial_days' => 30,
    ]);

    $owner = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $this->estate->users()->attach($owner->id, ['status' => 'accepted']);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.property-owners.make-resident', $owner))
        ->assertRedirect()
        ->assertSessionHas('success');

    setPermissionsTeamId($this->estate->id);
    expect($owner->fresh()->hasRole('resident'))->toBeTrue();

    $this->assertDatabaseHas('administrative_assignments', [
        'user_id' => $owner->id,
        'estate_id' => $this->estate->id,
        'role_id' => $this->residentRole->id,
        'is_active' => 1,
    ]);

    $this->assertDatabaseHas('resident_subscriptions', [
        'user_id' => $owner->id,
        'estate_id' => $this->estate->id,
        'status' => 'trial',
    ]);
});
