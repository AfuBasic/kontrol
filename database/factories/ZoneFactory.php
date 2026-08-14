<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Zone>
 */
class ZoneFactory extends Factory
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
            'name' => $this->faker->words(2, true),
        ];
    }
}
