<?php

use App\Events\SosTriggered;
use App\Jobs\ProcessSOSAlert;
use App\Models\EmergencyContact;
use App\Models\Estate;
use App\Models\HouseholdMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'household_member', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->resident = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->resident->assignRole('resident');
    $this->resident->estates()->attach($this->estate->id, ['status' => 'accepted']);
});

test('unauthenticated users cannot trigger an SOS alert', function () {
    $response = $this->post('/resident/sos/trigger');

    $response->assertRedirect(route('login'));
});

test('resident can trigger an SOS alert', function () {
    Event::fake([SosTriggered::class]);
    Queue::fake([ProcessSOSAlert::class]);

    EmergencyContact::create([
        'user_id' => $this->resident->id,
        'name' => 'Jane Doe',
        'relationship' => 'Spouse',
        'phone' => '+2348012345678',
    ]);

    $response = $this->actingAs($this->resident)
        ->from('/resident/home')
        ->post('/resident/sos/trigger');

    $response->assertRedirect('/resident/home');
    $response->assertSessionHas('sos_success');

    $flash = session('sos_success');
    expect($flash)->toHaveKeys(['id', 'time', 'has_emergency_contacts'])
        ->and($flash['has_emergency_contacts'])->toBeTrue();

    $this->assertDatabaseHas('sos_events', [
        'user_id' => $this->resident->id,
        'estate_id' => $this->estate->id,
        'status' => 'initiated',
    ]);

    Event::assertDispatched(SosTriggered::class, function ($event) {
        return $event->sosEvent->user_id === $this->resident->id
            && $event->sosEvent->estate_id === $this->estate->id;
    });

    Queue::assertPushed(ProcessSOSAlert::class, function ($job) {
        return $job->sosEvent->user_id === $this->resident->id;
    });
});

test('sos trigger is rate limited to 1 attempt per 60 seconds', function () {
    Event::fake([SosTriggered::class]);
    Queue::fake([ProcessSOSAlert::class]);

    // First attempt succeeds
    $this->actingAs($this->resident)
        ->from('/resident/home')
        ->post('/resident/sos/trigger')
        ->assertRedirect('/resident/home')
        ->assertSessionHas('sos_success');

    // Second immediate attempt gets rate limited
    $this->actingAs($this->resident)
        ->from('/resident/home')
        ->post('/resident/sos/trigger')
        ->assertRedirect('/resident/home')
        ->assertSessionHasErrors(['error' => 'Please wait before triggering another SOS.']);
});

test('household member can trigger an SOS alert and references primary resident contacts', function () {
    Event::fake([SosTriggered::class]);
    Queue::fake([ProcessSOSAlert::class]);

    EmergencyContact::create([
        'user_id' => $this->resident->id,
        'name' => 'Jane Doe',
        'relationship' => 'Spouse',
        'phone' => '+2348012345678',
    ]);

    $memberUser = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $memberUser->assignRole('household_member');
    $memberUser->estates()->attach($this->estate->id, [
        'status' => 'accepted',
        'relationship_type' => 'household_member',
    ]);

    HouseholdMember::create([
        'estate_id' => $this->estate->id,
        'primary_resident_id' => $this->resident->id,
        'household_member_id' => $memberUser->id,
    ]);

    $response = $this->actingAs($memberUser)
        ->from('/resident/home')
        ->post('/resident/sos/trigger');

    $response->assertRedirect('/resident/home');
    $response->assertSessionHas('sos_success');

    $flash = session('sos_success');
    expect($flash['has_emergency_contacts'])->toBeTrue();

    $this->assertDatabaseHas('sos_events', [
        'user_id' => $memberUser->id,
        'estate_id' => $this->estate->id,
        'status' => 'initiated',
    ]);
});
