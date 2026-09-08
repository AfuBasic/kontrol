<?php

namespace Database\Factories;

use App\Models\EstateOrganization;
use App\Models\OrganizationAccessMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrganizationAccessMember>
 */
class OrganizationAccessMemberFactory extends Factory
{
    protected $model = OrganizationAccessMember::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => EstateOrganization::factory(),
            'name' => fake()->name(),
            'identifier' => 'ID-'.fake()->unique()->numerify('####'),
            'category' => fake()->randomElement(['student', 'staff', 'member', 'contractor']),
            'status' => 'active',
            'valid_from' => now()->subMonth(),
            'valid_until' => now()->addYear(),
            'metadata' => [
                'department' => fake()->word(),
                'phone' => fake()->phoneNumber(),
            ],
            'created_by' => User::factory(),
        ];
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
            'valid_until' => now()->subDay(),
        ]);
    }

    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'student',
        ]);
    }

    public function staff(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'staff',
        ]);
    }

    public function contractor(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'contractor',
        ]);
    }
}
