<?php

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\SecurityEvent;
use App\Models\User;
use App\Services\Admin\DashboardService;
use App\Services\Admin\SuspiciousActivityService;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

function estateAdmin(): array
{
    $estate = Estate::factory()->create();
    $admin = User::factory()->create(['email_verified_at' => now()]);
    $estate->users()->attach($admin->id, ['status' => 'accepted']);
    $role = Role::create(['name' => 'admin', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    $viewPerm = Permission::firstOrCreate(['name' => 'suspicious_activity.view', 'guard_name' => 'web']);
    $reviewPerm = Permission::firstOrCreate(['name' => 'suspicious_activity.review', 'guard_name' => 'web']);
    $role->givePermissionTo([$viewPerm, $reviewPerm]);
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

    return [$estate, $admin, $assignment];
}

function residentIn(Estate $estate, string $name = 'Resident'): User
{
    $user = User::factory()->create(['name' => $name, 'email_verified_at' => now()]);
    $estate->users()->attach($user->id, ['status' => 'accepted']);
    $role = Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    AdministrativeAssignment::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'role_id' => $role->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    return $user;
}

test('suspicious event appears for the relevant estate admin', function () {
    [$estate, $admin, $assignment] = estateAdmin();
    $resident = residentIn($estate, 'John Adeyemi');

    $event = SecurityEvent::factory()->create([
        'user_id' => $resident->id,
        'type' => SecurityEventType::NewDeviceAttempt,
        'status' => SecurityEventStatus::Pending,
        'severity' => SecurityEventSeverity::Elevated,
    ]);

    $this->actingAs($admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.suspicious-activity.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/SuspiciousActivity/Index')
            ->has('events.data', 1)
            ->where('events.data.0.person_name', 'John Adeyemi')
            ->where('events.data.0.id', $event->ulid));
});

test('admin cannot see unrelated estate security events', function () {
    [$estateA, $adminA, $assignmentA] = estateAdmin();
    [$estateB] = estateAdmin();
    $residentB = residentIn($estateB, 'Other Estate');

    SecurityEvent::factory()->create(['user_id' => $residentB->id]);

    $this->actingAs($adminA)
        ->withSession(['active_context_assignment_id' => $assignmentA->id])
        ->get(route('admin.suspicious-activity.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('events.data', 0));
});

test('multi-estate user does not leak other estate context', function () {
    [$estateA, $adminA, $assignmentA] = estateAdmin();
    [$estateB] = estateAdmin();
    $user = residentIn($estateA, 'Shared User');
    $estateB->users()->attach($user->id, ['status' => 'accepted']);

    SecurityEvent::factory()->create([
        'user_id' => $user->id,
        'metadata' => ['note' => 'no estate names'],
    ]);

    $this->actingAs($adminA)
        ->withSession(['active_context_assignment_id' => $assignmentA->id])
        ->get(route('admin.suspicious-activity.index', ['event' => SecurityEvent::query()->first()->ulid]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('selected.person.name', 'Shared User')
            ->missing('selected.metadata')
            ->where('selected.timeline.0.label', fn ($label) => ! str_contains(strtolower((string) $label), strtolower($estateB->name))));
});

test('admin cannot approve a resident device', function () {
    [$estate, $admin, $assignment] = estateAdmin();
    $resident = residentIn($estate);
    $event = SecurityEvent::factory()->create(['user_id' => $resident->id]);

    expect($admin->can('approveDevice', $event))->toBeFalse();

    $this->actingAs($admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->post(route('admin.suspicious-activity.review', $event))
        ->assertRedirect();

    expect($event->fresh()->status)->toBe(SecurityEventStatus::Pending);
    expect($event->fresh()->reviewed_at)->not->toBeNull();
});

test('unauthorized resident cannot access suspicious activity', function () {
    [$estate] = estateAdmin();
    $resident = residentIn($estate);
    $role = Role::where('name', 'resident')->where('estate_id', $estate->id)->first();
    $assignment = AdministrativeAssignment::query()->where('user_id', $resident->id)->first();

    $this->actingAs($resident)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.suspicious-activity.index'))
        ->assertForbidden();
});

test('pending events require attention and resolved events remain in history', function () {
    [$estate, $admin, $assignment] = estateAdmin();
    $resident = residentIn($estate);
    SecurityEvent::factory()->create([
        'user_id' => $resident->id,
        'status' => SecurityEventStatus::Pending,
    ]);
    SecurityEvent::factory()->resolved()->create(['user_id' => $resident->id]);

    $this->actingAs($admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.suspicious-activity.index', ['attention' => 'attention']))
        ->assertInertia(fn ($page) => $page->has('events.data', 1));

    $this->actingAs($admin)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.suspicious-activity.index', ['attention' => 'resolved']))
        ->assertInertia(fn ($page) => $page->has('events.data', 1));
});

test('estate admin cannot traverse ids to view another estate event', function () {
    [$estateA, $adminA, $assignmentA] = estateAdmin();
    [$estateB] = estateAdmin();
    $residentB = residentIn($estateB);
    $event = SecurityEvent::factory()->create(['user_id' => $residentB->id]);

    $this->actingAs($adminA)
        ->withSession(['active_context_assignment_id' => $assignmentA->id])
        ->get(route('admin.suspicious-activity.index', ['event' => $event->ulid]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('selected', null));
});

test('dashboard widget counts events that require attention', function () {
    [$estate, $admin, $assignment] = estateAdmin();
    $resident = residentIn($estate);
    SecurityEvent::factory()->count(2)->create([
        'user_id' => $resident->id,
        'status' => SecurityEventStatus::Pending,
    ]);
    SecurityEvent::factory()->resolved()->create(['user_id' => $resident->id]);

    $this->actingAs($admin)->withSession(['active_context_assignment_id' => $assignment->id]);
    app(ContextManager::class)->activate($assignment);

    $result = app(SuspiciousActivityService::class)->dashboardSummary();

    expect($result['count'])->toBe(2);
    expect($result['items'])->toHaveCount(2);
});

test('action center includes suspicious activity that requires attention', function () {
    [$estate, $admin, $assignment] = estateAdmin();
    $resident = residentIn($estate, 'John Adeyemi');
    SecurityEvent::factory()->create([
        'user_id' => $resident->id,
        'status' => SecurityEventStatus::Pending,
        'severity' => SecurityEventSeverity::Elevated,
        'type' => SecurityEventType::NewDeviceAttempt,
    ]);
    SecurityEvent::factory()->resolved()->create(['user_id' => $resident->id]);

    $this->actingAs($admin)->withSession(['active_context_assignment_id' => $assignment->id]);
    app(ContextManager::class)->activate($assignment);

    $item = app(SuspiciousActivityService::class)->actionCenterItem();
    $attention = app(DashboardService::class)->getDetailedDashboardStats()['needsAttention'];

    expect($item)->not->toBeNull()
        ->and($item['id'])->toBe('suspicious_activity')
        ->and($item['count'])->toBe(1)
        ->and($item['severity'])->toBe('warning')
        ->and($item['previews'][0]['subtitle'])->toBe('John Adeyemi')
        ->and(collect($attention)->firstWhere('id', 'suspicious_activity'))->not->toBeNull();
});

test('user with custom role having suspicious_activity permissions can view and review events', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create(['email_verified_at' => now()]);
    $estate->users()->attach($user->id, ['status' => 'accepted']);
    $resident = residentIn($estate, 'Jane Doe');

    $customRole = Role::create(['name' => 'security_supervisor', 'guard_name' => 'web', 'estate_id' => $estate->id]);
    $viewPerm = Permission::firstOrCreate(['name' => 'suspicious_activity.view', 'guard_name' => 'web']);
    $reviewPerm = Permission::firstOrCreate(['name' => 'suspicious_activity.review', 'guard_name' => 'web']);
    $customRole->givePermissionTo([$viewPerm, $reviewPerm]);

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

    $event = SecurityEvent::factory()->create([
        'user_id' => $resident->id,
        'status' => SecurityEventStatus::Pending,
    ]);

    $this->actingAs($user)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->get(route('admin.suspicious-activity.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/SuspiciousActivity/Index')
            ->has('events.data', 1));

    $this->actingAs($user)
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->post(route('admin.suspicious-activity.review', $event))
        ->assertRedirect();

    expect($event->fresh()->reviewed_at)->not->toBeNull();
});

test('user with custom role without suspicious_activity.view permission gets 403', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create(['email_verified_at' => now()]);
    $estate->users()->attach($user->id, ['status' => 'accepted']);

    $customRole = Role::create(['name' => 'maintenance_lead', 'guard_name' => 'web', 'estate_id' => $estate->id]);

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
        ->get(route('admin.suspicious-activity.index'))
        ->assertForbidden();
});
