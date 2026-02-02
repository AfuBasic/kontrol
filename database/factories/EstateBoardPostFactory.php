<?php

namespace Database\Factories;

use App\Enums\EstateBoardPostStatus;
use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EstateBoardPost>
 */
class EstateBoardPostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(EstateBoardPostStatus::cases());

        return [
            'estate_id' => Estate::factory(),
            'user_id' => User::factory(),
            'title' => fake()->optional(0.7)->sentence(),
            'body' => fake()->paragraphs(rand(1, 3), true),
            'status' => $status,
            'published_at' => $status === EstateBoardPostStatus::Published
                ? fake()->dateTimeBetween('-30 days', 'now')
                : null,
        ];
    }

    /**
     * Indicate that the post is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EstateBoardPostStatus::Published,
            'published_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ]);
    }

    /**
     * Indicate that the post is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EstateBoardPostStatus::Draft,
            'published_at' => null,
        ]);
    }
}
