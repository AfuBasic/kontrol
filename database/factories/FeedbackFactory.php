<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\Feedback;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Feedback>
 */
class FeedbackFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'estate_id' => Estate::factory(),
            'category' => fake()->randomElement(['praise', 'improvement', 'idea', 'problem']),
            'message' => fake()->paragraph(),
            'status' => 'new',
            'source' => 'support_page',
            'platform' => 'web',
            'app_version' => '1.0.0',
            'route_or_screen' => '/account/support',
            'role_context' => 'resident',
            'support_mode' => false,
            'impersonator_id' => null,
        ];
    }
}
