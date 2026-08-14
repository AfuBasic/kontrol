<?php

use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->admin = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->admin->assignRole('admin');
    $this->estate->users()->attach($this->admin->id, ['status' => 'accepted']);
});

it('provides safe defaults for existing estates', function () {
    $settings = EstateSettings::forEstate($this->estate->id);

    $this->actingAs($this->admin)
        ->get(route('admin.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('settings.entry_point_checkout_enforced')
            ->has('settings.entry_points')
            ->where('settings.entry_point_checkout_enforced', false)
            ->where('settings.entry_points', [])
        );
});

it('rejects entry point checkout enabled if visitor checkout monitoring is off', function () {
    EstateSettings::forEstate($this->estate->id);

    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'access_codes_enabled' => true,
            'access_code_min_lifespan_minutes' => 60,
            'access_code_max_lifespan_minutes' => 1440,
            'access_code_single_use' => false,
            'require_vehicle_information' => false,
            'allow_residents_to_extend_visitor_passes' => false,
            'incident_categories' => ['Noise'],
            'default_incident_severity' => 'Low',
            'require_photo_evidence_for_incidents' => false,
            'require_resolution_notes_for_incidents' => false,
            'allow_residents_to_report_incidents' => false,
            'notify_admins_immediately_for_critical_incidents' => false,
            'allow_partial_payments' => false,
            'collection_reminder_frequency' => 'weekly',
            'collection_maximum_reminder_attempts' => 3,
            'send_reminder_before_due_date_days' => 1,

            // Testing this specific logic
            'visitor_checkout_enabled' => false,
            'entry_point_checkout_enforced' => true,
            'entry_points' => ['Main Gate'],
        ])
        ->assertInvalid(['entry_point_checkout_enforced' => 'Entry Point Checkout cannot be enforced when Checkout Monitoring is disabled.']);
});

it('rejects entry point checkout enabled if entry points array is empty', function () {
    EstateSettings::forEstate($this->estate->id);

    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'access_codes_enabled' => true,
            'access_code_min_lifespan_minutes' => 60,
            'access_code_max_lifespan_minutes' => 1440,
            'access_code_single_use' => false,
            'require_vehicle_information' => false,
            'allow_residents_to_extend_visitor_passes' => false,
            'incident_categories' => ['Noise'],
            'default_incident_severity' => 'Low',
            'require_photo_evidence_for_incidents' => false,
            'require_resolution_notes_for_incidents' => false,
            'allow_residents_to_report_incidents' => false,
            'notify_admins_immediately_for_critical_incidents' => false,
            'allow_partial_payments' => false,
            'collection_reminder_frequency' => 'weekly',
            'collection_maximum_reminder_attempts' => 3,
            'send_reminder_before_due_date_days' => 1,

            // Testing this specific logic
            'visitor_checkout_enabled' => true,
            'entry_point_checkout_enforced' => true,
            'entry_points' => [],
        ])
        ->assertInvalid(['entry_points' => 'At least one valid entry point is required when Entry Point Checkout is enforced.']);
});

it('rejects duplicate entry points case-insensitively', function () {
    EstateSettings::forEstate($this->estate->id);

    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'access_codes_enabled' => true,
            'access_code_min_lifespan_minutes' => 60,
            'access_code_max_lifespan_minutes' => 1440,
            'access_code_single_use' => false,
            'require_vehicle_information' => false,
            'allow_residents_to_extend_visitor_passes' => false,
            'incident_categories' => ['Noise'],
            'default_incident_severity' => 'Low',
            'require_photo_evidence_for_incidents' => false,
            'require_resolution_notes_for_incidents' => false,
            'allow_residents_to_report_incidents' => false,
            'notify_admins_immediately_for_critical_incidents' => false,
            'allow_partial_payments' => false,
            'collection_reminder_frequency' => 'weekly',
            'collection_maximum_reminder_attempts' => 3,
            'send_reminder_before_due_date_days' => 1,

            // Testing this specific logic
            'visitor_checkout_enabled' => true,
            'entry_point_checkout_enforced' => true,
            'entry_points' => ['Main Gate', 'MAIN GATE'],
        ])
        ->assertInvalid(['entry_points' => 'Entry points must have unique names.']);
});

it('updates authorized settings and preserves lists', function () {
    $settings = EstateSettings::forEstate($this->estate->id);

    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'access_codes_enabled' => true,
            'access_code_min_lifespan_minutes' => 60,
            'access_code_max_lifespan_minutes' => 1440,
            'access_code_single_use' => false,
            'require_vehicle_information' => false,
            'allow_residents_to_extend_visitor_passes' => false,
            'incident_categories' => ['Noise'],
            'default_incident_severity' => 'Low',
            'require_photo_evidence_for_incidents' => false,
            'require_resolution_notes_for_incidents' => false,
            'allow_residents_to_report_incidents' => false,
            'notify_admins_immediately_for_critical_incidents' => false,
            'allow_partial_payments' => false,
            'collection_reminder_frequency' => 'weekly',
            'collection_maximum_reminder_attempts' => 3,
            'send_reminder_before_due_date_days' => 1,

            // Testing this specific logic
            'visitor_checkout_enabled' => true,
            'entry_point_checkout_enforced' => true,
            'entry_points' => ['Main Gate', 'Back Gate'],
        ])
        ->assertValid()
        ->assertSessionHas('success');

    $settings->refresh();
    expect($settings->entry_point_checkout_enforced)->toBeTrue();
    expect($settings->entry_points)->toBe(['Main Gate', 'Back Gate']);
});

it('preserves entry points when disabling visitor checkout tracking', function () {
    $settings = EstateSettings::forEstate($this->estate->id);
    $settings->update([
        'visitor_checkout_enabled' => true,
        'entry_point_checkout_enforced' => true,
        'entry_points' => ['Main Gate', 'Back Gate'],
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'access_codes_enabled' => true,
            'access_code_min_lifespan_minutes' => 60,
            'access_code_max_lifespan_minutes' => 1440,
            'access_code_single_use' => false,
            'require_vehicle_information' => false,
            'allow_residents_to_extend_visitor_passes' => false,
            'incident_categories' => ['Noise'],
            'default_incident_severity' => 'Low',
            'require_photo_evidence_for_incidents' => false,
            'require_resolution_notes_for_incidents' => false,
            'allow_residents_to_report_incidents' => false,
            'notify_admins_immediately_for_critical_incidents' => false,
            'allow_partial_payments' => false,
            'collection_reminder_frequency' => 'weekly',
            'collection_maximum_reminder_attempts' => 3,
            'send_reminder_before_due_date_days' => 1,

            // Testing this specific logic
            'visitor_checkout_enabled' => false,
            'entry_point_checkout_enforced' => false,
            'entry_points' => ['Main Gate', 'Back Gate'],
        ])
        ->assertValid()
        ->assertSessionHas('success');

    $settings->refresh();
    expect($settings->visitor_checkout_enabled)->toBeFalse();
    expect($settings->entry_point_checkout_enforced)->toBeFalse();
    expect($settings->entry_points)->toBe(['Main Gate', 'Back Gate']);
});
