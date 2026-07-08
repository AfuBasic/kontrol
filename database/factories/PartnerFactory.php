<?php

namespace Database\Factories;

use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Partner>
 */
class PartnerFactory extends Factory
{
    protected $model = Partner::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'email' => fake()->unique()->companyEmail(),
            'description' => fake()->optional()->sentence(),
            'website' => fake()->optional()->url(),
            'contact_person' => fake()->optional()->name(),
            'phone' => fake()->optional()->phoneNumber(),
            'commission_rate' => fake()->randomFloat(2, 5, 25),
            'commission_type' => fake()->randomElement(['percentage', 'fixed']),
            'status' => 'active',
            'notes' => fake()->optional()->paragraph(),
        ];
    }
}
