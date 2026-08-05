<?php

namespace Database\Factories;

use App\Models\Estate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Estate>
 */
class EstateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'email' => fake()->unique()->companyEmail(),
            'address' => fake()->optional(0.8)->address(),
            'status' => fake()->randomElement(['active', 'inactive']),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Estate $estate) {
            $estate->settings()->create([
                'access_codes_enabled' => true,
                'access_code_min_lifespan_minutes' => 15,
                'access_code_max_lifespan_minutes' => 1440,
                'access_code_single_use' => true,
                'require_vehicle_information' => false,
                'allow_residents_to_extend_visitor_passes' => true,
                'visitor_checkout_enabled' => true,
                'incident_categories' => [
                    'Theft',
                    'Noise Complaint',
                    'Vandalism',
                    'Unauthorized Entry',
                    'Property Damage',
                    'Medical Emergency',
                ],
                'default_incident_severity' => 'Low',
                'require_photo_evidence_for_incidents' => false,
                'require_resolution_notes_for_incidents' => false,
                'allow_residents_to_report_incidents' => true,
                'notify_admins_immediately_for_critical_incidents' => true,
                'allow_partial_payments' => true,
                'minimum_partial_payment_amount' => 100000,
                'minimum_partial_payment_percentage' => 10,
                'collection_reminder_frequency' => 'weekly',
                'collection_maximum_reminder_attempts' => 3,
                'send_reminder_before_due_date_days' => 1,
            ]);
        });
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
