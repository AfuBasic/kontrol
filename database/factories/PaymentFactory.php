<?php

namespace Database\Factories;

use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'estate_id' => Estate::factory(),
            'collection_assignment_id' => CollectionAssignment::factory(),
            'amount' => fake()->numberBetween(1000, 50000),
            'provider' => 'paystack',
            'reference' => 'COLL-'.Str::ulid(),
            'status' => 'success',
            'paid_at' => now(),
            'raw_payload' => null,
        ];
    }
}