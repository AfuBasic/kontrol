<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $this->estate = Estate::factory()->create();

    // Setup roles
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->poRole = Role::firstOrCreate(['name' => 'property_owner', 'guard_name' => 'web']);
    $this->resRole = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'property_owners.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'property_owners.edit', 'guard_name' => 'web']);
    $adminRole->givePermissionTo('property_owners.view');
    $adminRole->givePermissionTo('property_owners.edit');

    // Admin
    $this->admin = User::factory()->create();
    $this->estate->users()->attach($this->admin, ['status' => 'accepted']);
    $this->adminAssignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);
    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');

    // Property Owner
    $this->propertyOwner = User::factory()->create();
    $this->propertyOwner->assignRole('property_owner');
    $this->estate->users()->attach($this->propertyOwner, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $this->propertyOwner->id]);

    // Available Resident 1
    $this->resident1 = User::factory()->create(['name' => 'John Doe']);
    $this->resident1->assignRole('resident');
    $this->estate->users()->attach($this->resident1, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $this->resident1->id]);

    // Available Resident 2
    $this->resident2 = User::factory()->create(['name' => 'Jane Smith']);
    $this->resident2->assignRole('resident');
    $this->estate->users()->attach($this->resident2, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $this->resident2->id]);

    // Already Assigned Resident
    $this->assignedResident = User::factory()->create();
    $this->assignedResident->assignRole('resident');
    $this->estate->users()->attach($this->assignedResident, ['status' => 'accepted', 'property_owner_id' => $this->propertyOwner->id]);
    UserProfile::create(['user_id' => $this->assignedResident->id]);
});

it('can fetch available residents to assign', function () {
    $this->withoutExceptionHandling();
    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.property-owners.available-residents', $this->propertyOwner));

    $response->assertOk();
    $response->assertJsonCount(2); // Only resident1 and resident2

    $json = $response->json();
    $names = collect($json)->pluck('name');
    expect($names)->toContain('John Doe', 'Jane Smith')
        ->not->toContain($this->assignedResident->name);
});

it('can search available residents', function () {
    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.property-owners.available-residents', ['propertyOwner' => $this->propertyOwner, 'search' => 'Jane']));

    $response->assertOk();
    $response->assertJsonCount(1);
    expect($response->json()[0]['name'])->toBe('Jane Smith');
});

it('can assign residents to a property owner', function () {
    $response = $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.property-owners.assign-residents', $this->propertyOwner), [
            'resident_ids' => [$this->resident1->id, $this->resident2->id],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Verify database: assignment stored in pivot table
    expect(
        DB::table('estate_users_membership')
            ->where('user_id', $this->resident1->id)
            ->where('estate_id', $this->estate->id)
            ->value('property_owner_id')
    )->toBe($this->propertyOwner->id)
        ->and(
            DB::table('estate_users_membership')
                ->where('user_id', $this->resident2->id)
                ->where('estate_id', $this->estate->id)
                ->value('property_owner_id')
        )->toBe($this->propertyOwner->id);
});

it('requires property_owners.edit permission to fetch or assign residents', function () {
    // A regular user without admin permissions
    $user = User::factory()->create();
    $this->estate->users()->attach($user, ['status' => 'accepted']);

    $this->actingAs($user)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.property-owners.available-residents', $this->propertyOwner))
        ->assertForbidden();

    $this->actingAs($user)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.property-owners.assign-residents', $this->propertyOwner), [
            'resident_ids' => [$this->resident1->id],
        ])
        ->assertForbidden();
});
