<?php

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Enums\IncidentCategory;
use App\Enums\IncidentPriority;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Incident;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use App\Services\IncidentService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();
    Permission::firstOrCreate(['name' => 'incidents.create', 'guard_name' => 'web']);
    $adminRole->givePermissionTo('incidents.create');

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

    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
    $this->zoneB = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone B']);
});

it('lets an admin assign a new incident to a zone', function () {
    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.incidents.store'), [
            'title' => 'Broken street light in Zone A',
            'body' => 'The street light near the Zone A playground has been out for three days.',
            'category' => IncidentCategory::Lighting->value,
            'priority' => IncidentPriority::Medium->value,
            'zone_id' => $this->zoneA->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('incidents', [
        'title' => 'Broken street light in Zone A',
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
    ]);
});

it('hides zone-assigned incidents from residents outside that zone', function () {
    $incident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
        'reporter_id' => $this->admin->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::EstateManagement,
        'title' => 'Zone A pipe burst',
        'body' => 'A pipe burst near the Zone A generator house is flooding the road.',
        'category' => IncidentCategory::WaterPlumbing,
        'priority' => IncidentPriority::High,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $residentA = User::factory()->create();
    $residentB = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $residentA->assignRole('resident');
    $residentB->assignRole('resident');
    $this->estate->users()->attach($residentA->id, ['status' => 'accepted', 'zone_id' => $this->zoneA->id]);
    $this->estate->users()->attach($residentB->id, ['status' => 'accepted', 'zone_id' => $this->zoneB->id]);

    $this->actingAs($residentA);
    setPermissionsTeamId($this->estate->id);
    app(ContextManager::class)->resolve();
    $visibleToA = app(IncidentService::class)->getFeed($this->estate->id);

    $this->actingAs($residentB);
    setPermissionsTeamId($this->estate->id);
    app(ContextManager::class)->resolve();
    $visibleToB = app(IncidentService::class)->getFeed($this->estate->id);

    $idsA = collect($visibleToA->items() ?? $visibleToA)->pluck('id');
    $idsB = collect($visibleToB->items() ?? $visibleToB)->pluck('id');

    expect($idsA)->toContain($incident->id)
        ->and($idsB)->not->toContain($incident->id);
});
