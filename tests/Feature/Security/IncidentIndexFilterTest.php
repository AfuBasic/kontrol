<?php

use App\Enums\AssignmentScope;
use App\Enums\IncidentCategory;
use App\Enums\IncidentPriority;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

it('applies priority filters on the security incident index', function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $estate = Estate::factory()->create();
    $security = User::factory()->create();
    $reporter = User::factory()->create();

    setPermissionsTeamId($estate->id);

    $securityRole = Role::firstOrCreate([
        'name' => 'security',
        'guard_name' => 'web',
        'estate_id' => $estate->id,
    ]);

    $residentRole = Role::firstOrCreate([
        'name' => 'resident',
        'guard_name' => 'web',
        'estate_id' => $estate->id,
    ]);

    $security->assignRole($securityRole);
    $reporter->assignRole($residentRole);

    $estate->users()->attach($security->id, ['status' => 'accepted']);
    $estate->users()->attach($reporter->id, ['status' => 'accepted']);

    $assignment = AdministrativeAssignment::create([
        'user_id' => $security->id,
        'estate_id' => $estate->id,
        'role_id' => $securityRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $highPriorityIncident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::ResidentReport,
        'title' => 'Suspicious activity near north gate',
        'body' => 'A resident reported someone lingering near the pedestrian access point.',
        'category' => IncidentCategory::Security,
        'priority' => IncidentPriority::High,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    Incident::withoutZoneIsolation()->create([
        'estate_id' => $estate->id,
        'reporter_id' => $reporter->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::ResidentReport,
        'title' => 'Broken walkway light',
        'body' => 'A walkway light needs replacement beside the clubhouse.',
        'category' => IncidentCategory::Lighting,
        'priority' => IncidentPriority::Low,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $this->actingAs($security)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('security.incidents.index', ['priority' => IncidentPriority::High->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Security/Incidents/Index')
            ->where('filters.priority', IncidentPriority::High->value)
            ->has('incidents.data', 1)
            ->where('incidents.data.0.id', $highPriorityIncident->id)
            ->etc()
        );
});
