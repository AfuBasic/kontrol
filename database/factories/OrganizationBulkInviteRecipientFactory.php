<?php

namespace Database\Factories;

use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrganizationBulkInviteRecipient>
 */
class OrganizationBulkInviteRecipientFactory extends Factory
{
    protected $model = OrganizationBulkInviteRecipient::class;

    public function definition(): array
    {
        return [
            'bulk_invite_id' => OrganizationBulkInvite::factory(),
            'email' => fake()->unique()->safeEmail(),
            'status' => 'active',
            'last_access_code_id' => null,
            'last_delivered_at' => fake()->optional(0.7)->dateTimeThisYear(),
            'delivery_status' => fake()->randomElement(['sent', 'sent', 'sent', 'pending', 'failed']),
            'delivery_error' => null,
        ];
    }

    public function sent(): static
    {
        return $this->state(fn () => [
            'delivery_status' => 'sent',
            'last_delivered_at' => fake()->dateTimeThisYear(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'delivery_status' => 'failed',
            'delivery_error' => 'Email address not reachable.',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'delivery_status' => 'pending',
            'last_delivered_at' => null,
        ]);
    }
}
