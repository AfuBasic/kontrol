<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\VisitorProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VisitorProfile>
 */
class VisitorProfileFactory extends Factory
{
    protected $model = VisitorProfile::class;

    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'name' => fake()->name(),
            'id_photo_hash' => fake()->sha256(),
            'id_photo_path' => null,
            'first_seen_at' => fake()->dateTimeThisYear(),
            'last_seen_at' => null,
            'visit_count' => fake()->randomDigit(),
            'notes' => null,
        ];
    }

    public function returning(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_seen_at' => fake()->dateTimeThisMonth(),
            'visit_count' => fake()->numberBetween(2, 20),
        ]);
    }

    public function withPhotoPath(string $path): static
    {
        return $this->state(fn (array $attributes) => [
            'id_photo_path' => $path,
        ]);
    }
}
