<?php

namespace Database\Factories;

use App\Models\CommissionableRevenue;
use App\Models\CommissionPlan;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommissionableRevenue>
 */
class CommissionableRevenueFactory extends Factory
{
    protected $model = CommissionableRevenue::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $revenueAmount = fake()->numberBetween(10000, 200000);
        $commissionRate = fake()->randomFloat(2, 5, 25);
        $commissionAmount = (int) round($revenueAmount * ($commissionRate / 100));

        return [
            'estate_id' => Estate::factory(),
            'partner_id' => Partner::factory(),
            'commission_plan_id' => CommissionPlan::factory(),
            'user_id' => User::factory(),
            'payment_transaction_id' => null,
            'revenue_amount' => $revenueAmount,
            'commission_amount' => $commissionAmount,
            'status' => 'pending',
        ];
    }

    public function settled(): static
    {
        return $this->state(['status' => 'settled']);
    }
}
