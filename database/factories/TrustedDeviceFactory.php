<?php

namespace Database\Factories;

use App\Models\TrustedDevice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TrustedDevice>
 */
class TrustedDeviceFactory extends Factory
{
    public function definition(): array
    {
        $now = now();

        return [
            'user_id' => User::factory(),
            'token_hash' => hash('sha256', Str::random(64)),
            'display_name' => 'Chrome on macOS',
            'device_type' => 'web',
            'platform' => 'mac',
            'browser' => 'Chrome',
            'ip_address' => fake()->ipv4(),
            'approximate_location' => 'Lagos, Nigeria',
            'first_seen_at' => $now,
            'last_used_at' => $now,
            'trusted_at' => $now,
            'expires_at' => $now->addDays(180),
        ];
    }

    public function revoked(): static
    {
        return $this->state(fn (array $attributes): array => [
            'revoked_at' => now(),
        ]);
    }
}
