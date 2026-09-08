<?php

namespace Database\Factories;

use App\Models\EstateOrganization;
use App\Models\OrganizationPublicWindow;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrganizationPublicWindow>
 */
class OrganizationPublicWindowFactory extends Factory
{
    protected $model = OrganizationPublicWindow::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => EstateOrganization::factory(),
            'name' => fake()->randomElement(['Sunday Service', 'Midweek Service', 'Friday Vigil', 'Open Hours']),
            'day_of_week' => 0, // Sunday
            'start_time' => '08:00:00',
            'end_time' => '13:00:00',
            'is_active' => true,
            'notes' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function sunday(): static
    {
        return $this->state(fn (array $attributes) => [
            'day_of_week' => 0,
        ]);
    }

    public function forDay(int $dayOfWeek): static
    {
        return $this->state(fn (array $attributes) => [
            'day_of_week' => $dayOfWeek,
        ]);
    }
}
