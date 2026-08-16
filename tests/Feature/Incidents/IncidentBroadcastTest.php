<?php

use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Events\Incidents\IncidentCreatedBroadcast;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    setPermissionsTeamId($this->estate->id);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);

    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
});

it('dispatches IncidentCreatedBroadcast event when an incident is created', function () {
    Event::fake([IncidentCreatedBroadcast::class]);

    $response = $this->actingAs($this->admin)
        ->post('/admin/incidents', [
            'title' => 'Emergency Leakage Block B',
            'body' => 'Description about major leakage reported inside Block B area.',
            'category' => 'utility',
            'priority' => 'low',
            'is_private' => false,
            'zone_id' => $this->zoneA->id,
        ]);

    if ($response->status() !== 302) {
        $response->dump();
    }
    $response->assertSessionHasNoErrors();

    Event::assertDispatched(IncidentCreatedBroadcast::class, function ($event) {
        return $event->incident->title === 'Emergency Leakage Block B'
            && (int) $event->incident->zone_id === (int) $this->zoneA->id;
    });
});

it('scopes broadcast channels appropriately for zone targeted vs estate-wide incidents', function () {
    $zoneIncident = Incident::create([
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
        'reporter_id' => $this->admin->id,
        'reporter_type' => get_class($this->admin),
        'source' => IncidentSource::EstateManagement,
        'title' => 'Zone Scoped',
        'body' => 'Leakage in Zone A description detail.',
        'category' => 'utility',
        'priority' => 'low',
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $estateIncident = Incident::create([
        'estate_id' => $this->estate->id,
        'zone_id' => null,
        'reporter_id' => $this->admin->id,
        'reporter_type' => get_class($this->admin),
        'source' => IncidentSource::EstateManagement,
        'title' => 'Estate Scoped',
        'body' => 'Leakage in Estate description detail.',
        'category' => 'utility',
        'priority' => 'low',
        'status' => IncidentStatus::Pending,
        'is_private' => false,
    ]);

    $zoneEvent = new IncidentCreatedBroadcast($zoneIncident);
    $estateEvent = new IncidentCreatedBroadcast($estateIncident);

    $zoneChannels = collect($zoneEvent->broadcastOn())->map(fn ($c) => $c->name)->toArray();
    $estateChannels = collect($estateEvent->broadcastOn())->map(fn ($c) => $c->name)->toArray();

    expect($zoneChannels)->toContain("private-estates.{$this->estate->id}.zones.{$this->zoneA->id}.residents")
        ->and($zoneChannels)->toContain("private-estates.{$this->estate->id}")
        ->and($estateChannels)->toContain("private-estates.{$this->estate->id}.residents")
        ->and($estateChannels)->toContain("private-estates.{$this->estate->id}");
});
