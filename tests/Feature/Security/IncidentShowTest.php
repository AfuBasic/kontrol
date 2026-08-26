<?php

use App\Enums\AssignmentScope;
use App\Enums\IncidentCategory;
use App\Enums\IncidentPriority;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\IncidentComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function createSecurityIncidentContext(): array
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $estate = Estate::factory()->create();
    $security = User::factory()->create(['name' => 'Ada Tunde']);
    $reporter = User::factory()->create(['name' => 'afuidris']);

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

    $incident = Incident::withoutZoneIsolation()->create([
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

    return compact('estate', 'security', 'reporter', 'assignment', 'incident');
}

it('renders the security incident detail workspace with official updates and discussion', function () {
    ['security' => $security, 'reporter' => $reporter, 'assignment' => $assignment, 'incident' => $incident] = createSecurityIncidentContext();

    $official = IncidentComment::create([
        'incident_id' => $incident->id,
        'user_id' => $security->id,
        'body' => 'It will',
        'is_official' => true,
        'parent_id' => null,
    ]);

    $discussion = IncidentComment::create([
        'incident_id' => $incident->id,
        'user_id' => $reporter->id,
        'body' => "I don't think that will work",
        'is_official' => false,
        'parent_id' => null,
    ]);

    IncidentComment::create([
        'incident_id' => $incident->id,
        'user_id' => $security->id,
        'body' => 'Patrol confirmed the gate is secure.',
        'is_official' => false,
        'parent_id' => $discussion->id,
    ]);

    $this->actingAs($security)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('security.incidents.show', $incident->hashid))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Security/Incidents/Show')
            ->where('incident.id', $incident->id)
            ->where('incident.title', 'Suspicious activity near north gate')
            ->where('incident.status', IncidentStatus::Pending->value)
            ->has('official_comments', 1)
            ->where('official_comments.0.id', $official->id)
            ->where('official_comments.0.body', 'It will')
            ->has('discussion_comments.data', 1)
            ->where('discussion_comments.data.0.id', $discussion->id)
            ->where('discussion_comments.data.0.body', "I don't think that will work")
            ->has('discussion_comments.data.0.replies', 1)
            ->etc()
        );
});

it('lets security post an official update on an open incident', function () {
    Notification::fake();

    ['security' => $security, 'assignment' => $assignment, 'incident' => $incident] = createSecurityIncidentContext();

    $this->actingAs($security)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->post(route('security.incidents.comments.store', $incident->hashid), [
            'body' => 'North gate patrol completed at 20:29.',
        ])
        ->assertRedirect();

    $comment = IncidentComment::query()->where('incident_id', $incident->id)->first();

    expect($comment)->not->toBeNull()
        ->and($comment->body)->toBe('North gate patrol completed at 20:29.')
        ->and($comment->is_official)->toBeTrue()
        ->and($comment->user_id)->toBe($security->id)
        ->and($comment->parent_id)->toBeNull();
});

it('forbids security from viewing an incident outside the active estate', function () {
    ['security' => $security, 'assignment' => $assignment] = createSecurityIncidentContext();

    $otherEstate = Estate::factory()->create();
    $otherReporter = User::factory()->create();

    $foreignIncident = Incident::withoutZoneIsolation()->create([
        'estate_id' => $otherEstate->id,
        'reporter_id' => $otherReporter->id,
        'reporter_type' => User::class,
        'source' => IncidentSource::ResidentReport,
        'title' => 'Foreign estate incident',
        'body' => 'This case belongs to a different estate.',
        'category' => IncidentCategory::Security,
        'priority' => IncidentPriority::Medium,
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $this->actingAs($security)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('security.incidents.show', $foreignIncident->hashid))
        ->assertForbidden();
});
