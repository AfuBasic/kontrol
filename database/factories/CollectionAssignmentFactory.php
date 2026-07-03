<?php

namespace Database\Factories;

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CollectionAssignment>
 */
class CollectionAssignmentFactory extends Factory
{
    protected $model = CollectionAssignment::class;

    public function definition(): array
    {
        return [
            'collection_id' => Collection::factory(),
            'estate_id' => Estate::factory(),
            'user_id' => User::factory(),
            'period' => null,
            'amount_due' => fake()->numberBetween(1000, 50000),
            'amount_paid' => 0,
            'status' => 'pending',
            'due_date' => now()->addDays(7)->toDateString(),
            'grace_until' => null,
            'paid_at' => null,
            'external_reference' => null,
        ];
    }
}