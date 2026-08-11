<?php

namespace Database\Factories;

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Spatie\Permission\Models\Role;

/**
 * @extends Factory<AdministrativeAssignment>
 */
class AdministrativeAssignmentFactory extends Factory
{
    protected $model = AdministrativeAssignment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'estate_id' => Estate::factory(),
            'role_id' => fn (array $attributes) => Role::create([
                'name' => 'role-'.fake()->unique()->slug(2),
                'guard_name' => 'web',
                'estate_id' => $attributes['estate_id'],
            ])->id,
            'scope_type' => AssignmentScope::Estate,
            'zone_id' => null,
            'is_primary' => false,
            'is_active' => true,
        ];
    }

    public function primary(): static
    {
        return $this->state(fn () => ['is_primary' => true]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function zoneScoped(int $zoneId): static
    {
        return $this->state(fn () => [
            'scope_type' => AssignmentScope::Zone,
            'zone_id' => $zoneId,
        ]);
    }
}
