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
});

it('is off by default and the settings page reports it with the zone count', function () {
    Zone::factory()->count(2)->create(['estate_id' => $this->estate->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('settings.zone_locked_passes', false)
            ->where('zoneCount', 2)
        );
});

it('can be switched on and off from settings without touching other settings', function () {
    $settings = EstateSettings::forEstate($this->estate->id);
    $settings->update(['quick_entry_enabled' => true]);

    $base = [
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

    $this->actingAs($this->admin)->put(route('admin.settings.update'), [...$base, 'zone_locked_passes' => true])
        ->assertSessionHasNoErrors();
    expect(EstateSettings::forEstate($this->estate->id)->zone_locked_passes)->toBeTrue();

    // A request that does not mention it leaves it as it was.
    $this->actingAs($this->admin)->put(route('admin.settings.update'), $base)->assertSessionHasNoErrors();
    expect(EstateSettings::forEstate($this->estate->id)->zone_locked_passes)->toBeTrue();

    $this->actingAs($this->admin)->put(route('admin.settings.update'), [...$base, 'zone_locked_passes' => false])
        ->assertSessionHasNoErrors();
    expect(EstateSettings::forEstate($this->estate->id)->zone_locked_passes)->toBeFalse();
});

it('rejects a value that is not a boolean', function () {
    $this->actingAs($this->admin)->put(route('admin.settings.update'), ['zone_locked_passes' => 'maybe'])
        ->assertSessionHasErrors('zone_locked_passes');
});
