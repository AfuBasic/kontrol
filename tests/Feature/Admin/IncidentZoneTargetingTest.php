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
use App\Models\IncidentComment;
use App\Models\Plan;
use App\Models\User;
use App\Models\Zone;
use App\Services\IncidentService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Inertia\Testing\AssertableInertia as Assert;
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
            'category' => 'Theft',
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

it('lets an estate-scoped admin delete an incident reported by another user', function () {
    $reporter = User::factory()->create();
    $incident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'reporter_id' => $reporter->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::ResidentReport,
        'title' => 'Broken gate light',
        'body' => 'The light at the main gate has been out since last night.',
        'category' => IncidentCategory::Lighting,
        'priority' => IncidentPriority::Medium,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->delete(route('admin.incidents.destroy', $incident->hashid))
        ->assertRedirect(route('admin.incidents.index'));

    $this->assertSoftDeleted('incidents', ['id' => $incident->id]);
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

function zoneScopedAdminAssignment(): AdministrativeAssignment
{
    $adminRole = Role::where('name', 'admin')->first();

    return AdministrativeAssignment::create([
        'user_id' => test()->admin->id,
        'estate_id' => test()->estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Zone,
        'zone_id' => test()->zoneA->id,
        'is_active' => true,
    ]);
}

it('forces zone-scoped admins to file incidents in their active zone', function () {
    $assignment = zoneScopedAdminAssignment();

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->post(route('admin.incidents.store'), [
            'title' => 'Zone scoped report',
            'body' => 'This report attempts to target another zone but should be constrained to the active zone.',
            'category' => 'Theft',
            'priority' => IncidentPriority::High->value,
            'zone_id' => $this->zoneB->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('incidents', [
        'title' => 'Zone scoped report',
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
    ]);

    $this->assertDatabaseMissing('incidents', [
        'title' => 'Zone scoped report',
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneB->id,
    ]);
});

it('only offers the active zone to zone-scoped admins on the create form', function () {
    $assignment = zoneScopedAdminAssignment();

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.incidents.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Incidents/Create')
            ->has('zones', 1)
            ->where('zones.0.id', $this->zoneA->id)
        );
});

it('hides other-zone incidents from zone-scoped admins on the incident board', function () {
    $assignment = zoneScopedAdminAssignment();

    $zoneAIncident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
        'reporter_id' => $this->admin->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::EstateManagement,
        'title' => 'Zone A visible incident',
        'body' => 'This should be visible to the Zone A admin.',
        'category' => IncidentCategory::Security,
        'priority' => IncidentPriority::High,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $zoneBIncident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneB->id,
        'reporter_id' => $this->admin->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::EstateManagement,
        'title' => 'Zone B hidden incident',
        'body' => 'This should be hidden from the Zone A admin.',
        'category' => IncidentCategory::Security,
        'priority' => IncidentPriority::High,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.incidents.index', ['view' => 'board']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Incidents/Index')
            ->where('incidents', function ($incidents) use ($zoneAIncident, $zoneBIncident): bool {
                $visibleIncidentIds = collect($incidents)->pluck('id');

                return $visibleIncidentIds->contains($zoneAIncident->id)
                    && ! $visibleIncidentIds->contains($zoneBIncident->id);
            })
        );
});

it('rejects invalid categories and assignees outside the incident zone', function () {
    $otherAdmin = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $otherAdmin->assignRole('admin');
    $this->estate->users()->attach($otherAdmin->id, ['status' => 'accepted']);

    $adminRole = Role::where('name', 'admin')->first();
    AdministrativeAssignment::create([
        'user_id' => $otherAdmin->id,
        'estate_id' => $this->estate->id,
        'role_id' => $adminRole->id,
        'scope_type' => AssignmentScope::Zone,
        'zone_id' => $this->zoneB->id,
        'is_active' => true,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.incidents.store'), [
            'title' => 'Invalid category report',
            'body' => 'This report should fail because the category and assignee are not valid for this context.',
            'category' => 'not_a_real_category',
            'priority' => IncidentPriority::Medium->value,
            'zone_id' => $this->zoneA->id,
            'assigned_to' => $otherAdmin->id,
        ])
        ->assertSessionHasErrors(['category', 'assigned_to']);
});

it('rejects comment replies whose parent belongs to another incident', function () {
    $incident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'reporter_id' => $this->admin->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::EstateManagement,
        'title' => 'Primary incident',
        'body' => 'The incident that should receive the comment.',
        'category' => IncidentCategory::Security,
        'priority' => IncidentPriority::Medium,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $otherIncident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'reporter_id' => $this->admin->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::EstateManagement,
        'title' => 'Other incident',
        'body' => 'The incident that owns the parent comment.',
        'category' => IncidentCategory::Security,
        'priority' => IncidentPriority::Medium,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $otherParent = IncidentComment::create([
        'incident_id' => $otherIncident->id,
        'user_id' => $this->admin->id,
        'body' => 'Parent on another incident.',
        'is_official' => false,
        'parent_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->post(route('admin.incidents.comments.store', $incident->hashid), [
            'body' => 'This reply should not attach across incidents.',
            'parent_id' => $otherParent->id,
        ])
        ->assertSessionHasErrors(['parent_id']);

    $this->assertDatabaseMissing('incident_comments', [
        'incident_id' => $incident->id,
        'parent_id' => $otherParent->id,
    ]);
});
