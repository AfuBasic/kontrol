<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();

    $this->adminAssignment = AdministrativeAssignment::create([
        'user_id' => $this->admin->id,
        'estate_id' => $this->estate->id,
        'role_id' => $adminRole->id,
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

test('admin can view zones list', function () {
    Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Phase 1 Block A',
        'description' => 'Residential block covering north area',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)
        ->get('/admin/zones');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Zones/Index')
        ->has('zones', 1)
        ->where('zones.0.name', 'Phase 1 Block A')
    );
});

test('admin can create a new zone', function () {
    $response = $this->actingAs($this->admin)
        ->post('/admin/zones', [
            'name' => 'North Wing Phase 2',
            'description' => 'Commercial and residential units',
            'is_active' => true,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Zone created successfully.');

    $this->assertDatabaseHas('zones', [
        'estate_id' => $this->estate->id,
        'name' => 'North Wing Phase 2',
        'description' => 'Commercial and residential units',
        'is_active' => true,
    ]);
});

test('admin can update an existing zone', function () {
    $zone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Old Zone Name',
        'description' => 'Old description',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/zones/{$zone->id}", [
            'name' => 'Updated Zone Name',
            'description' => 'Updated description',
            'is_active' => false,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Zone updated successfully.');

    $this->assertDatabaseHas('zones', [
        'id' => $zone->id,
        'name' => 'Updated Zone Name',
        'description' => 'Updated description',
        'is_active' => false,
    ]);
});

test('admin can archive a zone', function () {
    $zone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Zone to Archive',
    ]);

    $response = $this->actingAs($this->admin)
        ->delete("/admin/zones/{$zone->id}");

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Zone archived successfully.');

    $this->assertSoftDeleted('zones', [
        'id' => $zone->id,
    ]);
});

test('admin cannot create a zone with a name that is already taken by a soft deleted zone', function () {
    $zone = Zone::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'Archived Zone',
    ]);
    $zone->delete(); // Soft delete it

    $response = $this->actingAs($this->admin)
        ->post('/admin/zones', [
            'name' => 'Archived Zone',
            'description' => 'Try to recreate archived zone',
            'is_active' => true,
        ]);

    $response->assertSessionHasErrors(['name']);
});
