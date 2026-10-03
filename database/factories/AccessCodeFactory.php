<?php

namespace Database\Factories;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AccessCode>
 */
class AccessCodeFactory extends Factory
{
    protected $model = AccessCode::class;

    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'user_id' => User::factory(),
            'code' => strtoupper(Str::random(6)),
            'type' => fake()->randomElement(['single_use', 'long_lived']),
            'source' => AccessCodeSource::Web,
            'visitor_name' => fake()->name(),
            'visitor_phone' => fake()->phoneNumber(),
            'purpose' => fake()->randomElement(['Visit', 'Delivery', 'Service', 'Family', 'Business']),
            'status' => AccessCodeStatus::Active,
            'expires_at' => now()->addHours(fake()->numberBetween(1, 48)),
            'has_vehicle' => false,
            'notes' => null,
        ];
    }

    public function used(): static
    {
        return $this->state(fn () => [
            'status' => AccessCodeStatus::Used,
            'used_at' => now()->subHours(fake()->numberBetween(1, 72)),
            'expires_at' => now()->subHours(fake()->numberBetween(1, 24)),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => AccessCodeStatus::Expired,
            'expires_at' => now()->subDays(fake()->numberBetween(1, 30)),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn () => [
            'status' => AccessCodeStatus::Revoked,
            'revoked_at' => now()->subDays(fake()->numberBetween(1, 10)),
        ]);
    }

    public function dated(CarbonInterface $date): static
    {
        return $this->state(fn () => [
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }
}
