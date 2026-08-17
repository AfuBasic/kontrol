<?php

use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('validates and updates visitor_checkout_enabled setting', function () {
    $estate = Estate::factory()->create();
    $adminUser = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $adminUser->assignRole('admin');
    $adminUser->estates()->attach($estate->id, ['status' => 'accepted']);

    // Ensure settings exist
    $settings = EstateSettings::forEstate($estate->id);
    if (! $settings) {
        $settings = $estate->settings()->create([]);
    }

    // Toggle checkout via settings update
    $response = $this->actingAs($adminUser)
        ->put(route('admin.settings.update'), [
            'access_codes_enabled' => true,
            'access_code_min_lifespan_minutes' => 60,
            'access_code_max_lifespan_minutes' => 1440,
            'access_code_single_use' => true,
            'visitor_checkout_enabled' => true,
            'access_code_grace_period_minutes' => 15,
            'access_code_daily_limit_per_resident' => 10,
            'access_code_require_confirmation' => false,
            'free_trial_enabled' => false,
            'grace_period_days' => 7,
            'require_vehicle_information' => false,
            'allow_residents_to_extend_visitor_passes' => false,
            'entry_point_checkout_enforced' => false,
            'default_incident_severity' => 'Low',
            'require_photo_evidence_for_incidents' => false,
            'require_resolution_notes_for_incidents' => false,
            'allow_residents_to_report_incidents' => false,
            'notify_admins_immediately_for_critical_incidents' => false,
            'allow_partial_payments' => false,
            'collection_reminder_frequency' => 'daily',
            'collection_maximum_reminder_attempts' => 3,
            'send_reminder_before_due_date_days' => 2,
        ]);

    $response->assertSessionHasNoErrors();
    $settings->refresh();
    expect($settings->visitor_checkout_enabled)->toBeTrue();
});
