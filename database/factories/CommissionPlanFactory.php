<?php

namespace Database\Factories;

use App\Models\CommissionPlan;
use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommissionPlan>
 */
class CommissionPlanFactory extends Factory
{
    protected $model = CommissionPlan::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Commission Plan',
            'commission_rate' => fake()->randomFloat(2, 5, 25),
            'source_partner_id' => Partner::factory(),
            'duration_months' => 12,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
