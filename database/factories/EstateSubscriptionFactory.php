<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class EstateSubscriptionFactory extends Factory
{
    protected $model = EstateSubscription::class;

    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'plan_id' => Plan::factory(),
            'status' => 'active',
            'billing_interval' => 'annually',
            'next_billing_date' => now()->addYear(),
        ];
    }
}
