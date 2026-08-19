<?php

namespace Database\Factories;

use App\Enums\DeviceAuthorizationStatus;
use App\Models\DeviceAuthorizationRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DeviceAuthorizationRequest>
 */
class DeviceAuthorizationRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'token_hash' => hash('sha256', Str::random(64)),
            'display_name' => 'Chrome on macOS',
            'device_type' => 'web',
            'platform' => 'mac',
            'browser' => 'Chrome',
            'approximate_location' => 'Lagos, Nigeria',
            'request_ip' => fake()->ipv4(),
            'status' => DeviceAuthorizationStatus::Pending,
            'remember' => false,
            'expires_at' => now()->addHours(2),
            'last_notified_at' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => DeviceAuthorizationStatus::Approved,
            'approved_at' => now(),
        ]);
    }

    public function denied(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => DeviceAuthorizationStatus::Denied,
            'denied_at' => now(),
        ]);
    }

    public function consumed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => DeviceAuthorizationStatus::Consumed,
            'approved_at' => now()->subMinute(),
            'consumed_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => DeviceAuthorizationStatus::Expired,
            'expires_at' => now()->subHour(),
        ]);
    }
}
