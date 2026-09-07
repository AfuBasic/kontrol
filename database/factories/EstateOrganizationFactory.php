<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\EstateOrganization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EstateOrganization>
 */
class EstateOrganizationFactory extends Factory
{

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'name' => fake()->company(),
            'type' => fake()->randomElement(['school', 'church', 'hospital', 'business', 'other']),
            'operating_hours' => null,
            'quick_entry_enabled' => true,
            'is_active' => true,
        ];
    }
}
