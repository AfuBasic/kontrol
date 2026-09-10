<?php

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\SosEvent;
use App\Models\User;
use App\Notifications\Resident\SosResponderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'security', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->resident = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->resident->assignRole('resident');
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->sosEvent = SosEvent::create([
        'user_id' => $this->resident->id,
        'estate_id' => $this->estate->id,
        'triggered_at' => now(),
        'status' => 'initiated',
    ]);
});

test('resident cannot acknowledge an SOS alert', function () {
    $response = $this->actingAs($this->resident)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->post(route('security.sos.acknowledge', ['sosEvent' => $this->sosEvent->id]));

    $response->assertForbidden();
});

test('security guard in a different estate cannot acknowledge an SOS alert', function () {
    $otherEstate = Estate::factory()->create();
    $guard = User::factory()->create();

    setPermissionsTeamId($otherEstate->id);
    $guard->assignRole('security');
    $guard->estates()->attach($otherEstate->id, ['status' => 'accepted']);

    $securityRole = Role::where('name', 'security')->first();
    $assignment = AdministrativeAssignment::create([
        'user_id' => $guard->id,
        'estate_id' => $otherEstate->id,
        'role_id' => $securityRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $response = $this->actingAs($guard)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->post(route('security.sos.acknowledge', ['sosEvent' => $this->sosEvent->id]));

    $response->assertForbidden();
});

test('security guard in same estate can acknowledge an SOS alert', function () {
    Notification::fake();

    $guard = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $guard->assignRole('security');
    $guard->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $securityRole = Role::where('name', 'security')->first();
    $assignment = AdministrativeAssignment::create([
        'user_id' => $guard->id,
        'estate_id' => $this->estate->id,
        'role_id' => $securityRole->id,
        'scope_type' => AssignmentScope::Estate,
        'is_active' => true,
    ]);

    $response = $this->actingAs($guard)
        ->withHeaders(['X-Capacitor-App' => 'true'])
        ->withSession(['active_context_assignment_id' => $assignment->id])
        ->from(route('security.home'))
        ->post(route('security.sos.acknowledge', ['sosEvent' => $this->sosEvent->id]));

    $response->assertRedirect(route('security.home'));
    $response->assertSessionHas('success', 'SOS alert acknowledged');

    $this->sosEvent->refresh();
    expect($this->sosEvent->status)->toBe('acknowledged')
        ->and($this->sosEvent->acknowledged_by)->toBe($guard->id)
        ->and($this->sosEvent->acknowledged_at)->not->toBeNull();

    Notification::assertSentTo(
        $this->resident,
        SosResponderNotification::class,
        function ($notification) {
            return $notification->sosEvent->id === $this->sosEvent->id;
        }
    );
});
