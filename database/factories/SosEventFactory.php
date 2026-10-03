<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\SosEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SosEvent>
 */
class SosEventFactory extends Factory
{
    protected $model = SosEvent::class;

    public function definition(): array
    {
        $triggeredAt = now()->subDays(fake()->numberBetween(0, 180));

        return [
            'user_id' => User::factory(),
            'estate_id' => Estate::factory(),
            'zone_id' => null,
            'triggered_at' => $triggeredAt,
            'status' => 'pending',
            'acknowledged_at' => null,
            'acknowledged_by' => null,
            'created_at' => $triggeredAt,
            'updated_at' => $triggeredAt,
        ];
    }

    public function acknowledged(): static
    {
        return $this->state(fn () => [
            'status' => 'acknowledged',
            'acknowledged_at' => now()->subMinutes(fake()->numberBetween(5, 120)),
            'acknowledged_by' => null, // will be set by seeder
        ]);
    }
}
