<?php

namespace Database\Factories;

use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Models\SecurityEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SecurityEvent>
 */
class SecurityEventFactory extends Factory
{
    public function definition(): array
    {
        $detectedAt = now();

        return [
            'user_id' => User::factory(),
            'type' => SecurityEventType::NewDeviceAttempt,
            'severity' => SecurityEventSeverity::Elevated,
            'status' => SecurityEventStatus::Pending,
            'display_name' => 'Chrome on macOS',
            'approximate_location' => 'Lagos, Nigeria',
            'request_ip' => fake()->ipv4(),
            'detected_at' => $detectedAt,
            'timeline' => [
                [
                    'at' => $detectedAt->toIso8601String(),
                    'type' => 'detected',
                    'label' => 'Unknown device attempted sign-in.',
                    'metadata' => [],
                ],
            ],
            'metadata' => [],
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => SecurityEventStatus::Resolved,
            'severity' => SecurityEventSeverity::Info,
            'type' => SecurityEventType::DeviceAuthorized,
            'resolved_at' => now(),
            'resolution' => 'Authorized by account owner.',
        ]);
    }

    public function denied(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => SecurityEventStatus::Denied,
            'severity' => SecurityEventSeverity::High,
            'type' => SecurityEventType::DeviceDenied,
            'resolved_at' => now(),
            'resolution' => 'Denied by account owner.',
        ]);
    }
}
