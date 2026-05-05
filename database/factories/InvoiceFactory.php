<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'user_id' => User::factory(),
            'plan_id' => Plan::factory(),
            'invoice_number' => 'KTRL-'.$this->faker->unique()->numberBetween(1000, 9999),
            'amount' => 500000,
            'resident_count' => 1,
            'billing_period_start' => now(),
            'billing_period_end' => now()->addMonth(),
            'status' => 'pending',
            'due_date' => now()->addDays(7),
        ];
    }
}
