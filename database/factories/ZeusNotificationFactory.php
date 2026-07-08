<?php

namespace Database\Factories;

use App\Models\ZeusNotification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ZeusNotification>
 */
class ZeusNotificationFactory extends Factory
{
    protected $model = ZeusNotification::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => 'partner_estate_request',
            'title' => 'New partner estate request',
            'body' => fake()->sentence(),
            'action_url' => '/zeus/partner-requests',
            'data' => null,
            'read_at' => null,
        ];
    }

    public function read(): static
    {
        return $this->state(fn () => [
            'read_at' => now(),
        ]);
    }
}
