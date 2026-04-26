<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\ResidentSubscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ResidentSubscriptionFactory extends Factory
{
    protected $model = ResidentSubscription::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'estate_id' => Estate::factory(),
            'status' => 'active',
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
        ];
    }
}
