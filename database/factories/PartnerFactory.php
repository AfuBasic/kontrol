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

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'description' => fake()->optional()->sentence(),
            'website' => fake()->optional()->url(),
            'contact_person' => fake()->optional()->name(),
            'commission_rate' => fake()->randomFloat(2, 5, 25),
            'commission_type' => fake()->randomElement(['percentage', 'fixed']),
            'status' => 'active',
            'notes' => fake()->optional()->paragraph(),
        ];
    }

    public function configure(): self
    {
        return $this->afterCreating(function (Partner $partner) {
            $user = \App\Models\User::factory()->create([
                'name' => $partner->name,
                'email' => fake()->unique()->companyEmail(),
                'user_type' => 'affiliate',
                'partner_id' => $partner->id,
            ]);

            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                ['phone' => fake()->phoneNumber()]
            );
        });
    }
}
