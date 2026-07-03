<?php

namespace Database\Factories;

use App\Models\Collection;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Collection>
 */
class CollectionFactory extends Factory
{
    protected $model = Collection::class;

    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'amount' => fake()->numberBetween(1000, 50000),
            'billing_type' => 'one_time',
            'recurring_interval' => null,
            'start_date' => now()->toDateString(),
            'due_day' => 1,
            'grace_days' => 0,
            'late_fee' => null,
            'applies_to' => 'all',
            'status' => 'active',
            'created_by' => User::factory(),
        ];
    }
}