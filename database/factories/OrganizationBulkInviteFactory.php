<?php

namespace Database\Factories;

use App\Models\EstateOrganization;
use App\Models\OrganizationBulkInvite;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrganizationBulkInvite>
 */
class OrganizationBulkInviteFactory extends Factory
{
    protected $model = OrganizationBulkInvite::class;

    public function definition(): array
    {
        $validFrom = now()->subMonths(fake()->numberBetween(1, 10));
        $validUntil = $validFrom->copy()->addMonths(fake()->numberBetween(3, 12));

        return [
            'organization_id' => EstateOrganization::factory(),
            'estate_id' => null, // set by seeder
            'created_by' => User::factory(),
            'name' => fake()->randomElement([
                'Staff Access Pass',
                'Student Entry Pass',
                'Contractor Permit',
                'Member Access Card',
                'Visitor Pass Batch',
                'Event Attendees',
                'Delivery Personnel',
                'Volunteer Access',
            ]).' '.fake()->year(),
            'purpose' => fake()->sentence(6),
            'role' => fake()->randomElement(['member', 'staff', 'student', 'contractor']),
            'valid_from' => $validFrom->toDateString(),
            'valid_until' => $validUntil->toDateString(),
            'auto_renew' => fake()->boolean(40),
            'send_immediately' => true,
            'status' => 'active',
            'last_renewed_at' => fake()->optional(0.5)->dateTimeBetween($validFrom, now()),
            'next_renewal_at' => $validUntil->toDateString(),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => 'expired',
            'valid_until' => now()->subMonths(fake()->numberBetween(1, 6))->toDateString(),
        ]);
    }

    public function autoRenew(): static
    {
        return $this->state(fn () => [
            'auto_renew' => true,
        ]);
    }
}
