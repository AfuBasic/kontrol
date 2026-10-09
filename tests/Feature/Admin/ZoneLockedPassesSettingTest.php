<?php

use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->admin->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $this->base = [
        'access_codes_enabled' => true,
        'access_code_min_lifespan_minutes' => 60,
        'access_code_max_lifespan_minutes' => 1440,
        'access_code_single_use' => true,
        'visitor_checkout_enabled' => false,
        'quick_entry_enabled' => true,
        'entry_point_checkout_enforced' => false,
        'access_code_grace_period_minutes' => 0,
        'require_vehicle_information' => false,
        'allow_residents_to_extend_visitor_passes' => false,
        'default_incident_severity' => 'Low',
        'require_photo_evidence_for_incidents' => false,
        'require_resolution_notes_for_incidents' => false,
        'allow_residents_to_report_incidents' => false,
        'notify_admins_immediately_for_critical_incidents' => false,
        'allow_partial_payments' => false,
        'collection_reminder_frequency' => 'daily',
        'collection_maximum_reminder_attempts' => 3,
        'send_reminder_before_due_date_days' => 2,
    ];

    $this->save = fn (array $overrides = []) => $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [...$this->base, ...$overrides]);

    $this->stored = fn () => EstateSettings::forEstate($this->estate->id)->fresh();
});

// ---------- What the settings page is given ----------

it('is off by default and the page lists the estate zones and gate zones', function () {
    $zone = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Block A']);
    Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Block B']);
    EstateSettings::forEstate($this->estate->id)->update(['entry_points' => ['Main Gate'], 'entry_point_zones' => ['Main Gate' => $zone->id]]);

    $this->actingAs($this->admin)
        ->get(route('admin.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('settings.zone_locked_passes', false)
            ->has('zones', 2)
            ->where('zones.0.name', 'Block A')
            ->where('settings.entry_point_zones.Main Gate', $zone->id)
        );
});

it('does not list zones of another estate', function () {
    Zone::factory()->create(['estate_id' => $this->estate->id]);
    Zone::factory()->create(['estate_id' => Estate::factory()->create()->id]);

    $this->actingAs($this->admin)->get(route('admin.settings'))
        ->assertInertia(fn ($page) => $page->has('zones', 1));
});

// ---------- Saving ----------

it('saves the lock with a zone chosen for every gate, including all zones for a shared gate', function () {
    [$a, $b] = Zone::factory()->count(2)->create(['estate_id' => $this->estate->id]);

    ($this->save)([
        'zone_locked_passes' => true,
        'entry_points' => ['Gate A', 'Gate B', 'Main Gate'],
        'entry_point_zones' => [
            ['gate' => 'Gate A', 'zone' => (string) $a->id],
            ['gate' => 'Gate B', 'zone' => (string) $b->id],
            ['gate' => 'Main Gate', 'zone' => 'all'],
        ],
    ])->assertSessionHasNoErrors();

    $settings = ($this->stored)();
    expect($settings->zone_locked_passes)->toBeTrue()
        ->and($settings->entry_point_zones)->toBe(['Gate A' => $a->id, 'Gate B' => $b->id, 'Main Gate' => 'all']);
});

it('refuses the lock when the estate has fewer than two zones', function () {
    Zone::factory()->create(['estate_id' => $this->estate->id]);

    ($this->save)(['zone_locked_passes' => true, 'entry_points' => ['Gate A'], 'entry_point_zones' => [['gate' => 'Gate A', 'zone' => 'all']]])
        ->assertSessionHasErrors('zone_locked_passes');

    expect(($this->stored)()->zone_locked_passes)->toBeFalse();
});

it('refuses the lock when a gate has no zone chosen, naming every gate that is missing one', function () {
    [$a] = Zone::factory()->count(2)->create(['estate_id' => $this->estate->id]);

    $errors = ($this->save)([
        'zone_locked_passes' => true,
        'entry_points' => ['Gate A', 'Gate B', 'Gate C'],
        'entry_point_zones' => [['gate' => 'Gate A', 'zone' => (string) $a->id]],
    ])->assertSessionHasErrors('entry_point_zones')->baseResponse->getSession()->get('errors')->get('entry_point_zones');

    expect($errors[0])->toContain('"Gate B"')->toContain('"Gate C"')->not->toContain('"Gate A"');
});

it('refuses the lock when there are no gates at all', function () {
    Zone::factory()->count(2)->create(['estate_id' => $this->estate->id]);

    ($this->save)(['zone_locked_passes' => true, 'entry_points' => [], 'entry_point_zones' => []])
        ->assertSessionHasErrors('entry_points');
});

it('rejects a zone that belongs to another estate or has been deleted', function () {
    Zone::factory()->count(2)->create(['estate_id' => $this->estate->id]);
    $foreign = Zone::factory()->create(['estate_id' => Estate::factory()->create()->id]);
    $deleted = Zone::factory()->create(['estate_id' => $this->estate->id]);
    $deleted->delete();

    foreach ([$foreign, $deleted] as $zone) {
        ($this->save)([
            'zone_locked_passes' => true,
            'entry_points' => ['Gate A'],
            'entry_point_zones' => [['gate' => 'Gate A', 'zone' => (string) $zone->id]],
        ])->assertSessionHasErrors('entry_point_zones');
    }
});

it('drops zones for gates that were removed', function () {
    [$a, $b] = Zone::factory()->count(2)->create(['estate_id' => $this->estate->id]);
    EstateSettings::forEstate($this->estate->id)->update([
        'entry_points' => ['Gate A', 'Gate B'],
        'entry_point_zones' => ['Gate A' => $a->id, 'Gate B' => $b->id],
    ]);

    ($this->save)([
        'zone_locked_passes' => true,
        'entry_points' => ['Gate A'],
        'entry_point_zones' => [['gate' => 'Gate A', 'zone' => (string) $a->id], ['gate' => 'Gate B', 'zone' => (string) $b->id]],
    ])->assertSessionHasNoErrors();

    expect(($this->stored)()->entry_point_zones)->toBe(['Gate A' => $a->id]);
});

it('keeps gate names with dots intact', function () {
    [$a] = Zone::factory()->count(2)->create(['estate_id' => $this->estate->id]);

    ($this->save)([
        'zone_locked_passes' => true,
        'entry_points' => ['Gate 1.2'],
        'entry_point_zones' => [['gate' => 'Gate 1.2', 'zone' => (string) $a->id]],
    ])->assertSessionHasNoErrors();

    expect(($this->stored)()->entry_point_zones)->toBe(['Gate 1.2' => $a->id]);
});

it('does not ask for zones when the lock is off', function () {
    ($this->save)(['zone_locked_passes' => false, 'entry_points' => ['Gate A'], 'entry_point_zones' => []])
        ->assertSessionHasNoErrors();
});

it('leaves the lock alone when a request does not mention it', function () {
    EstateSettings::forEstate($this->estate->id)->update(['zone_locked_passes' => true]);

    ($this->save)()->assertSessionHasNoErrors();

    expect(($this->stored)()->zone_locked_passes)->toBeTrue();
});

it('rejects a value that is not a boolean', function () {
    $this->actingAs($this->admin)->put(route('admin.settings.update'), ['zone_locked_passes' => 'maybe'])
        ->assertSessionHasErrors('zone_locked_passes');
});
