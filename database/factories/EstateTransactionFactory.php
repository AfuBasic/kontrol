<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Estate;
use App\Models\EstateTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<EstateTransaction>
 */
class EstateTransactionFactory extends Factory
{
    protected $model = EstateTransaction::class;

    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'user_id' => User::factory(),
            'type' => TransactionType::CollectionPayment,
            'direction' => TransactionDirection::Credit,
            'amount' => fake()->numberBetween(100000, 5000000),
            'currency' => 'NGN',
            'status' => TransactionStatus::Success,
            'payment_method' => PaymentMethod::Paystack,
            'provider' => 'paystack',
            'reference_number' => 'KTR-'.fake()->unique()->numerify('######'),
            'gateway_reference' => 'COLL-'.Str::ulid(),
            'description' => fake()->sentence(3),
            'idempotency_key' => 'factory_'.Str::ulid(),
            'paid_at' => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => TransactionStatus::Pending,
            'type' => TransactionType::PendingPayment,
            'paid_at' => null,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => TransactionStatus::Failed,
            'type' => TransactionType::FailedPayment,
            'paid_at' => null,
            'failed_at' => now(),
        ]);
    }

    public function refund(): static
    {
        return $this->state(fn () => [
            'type' => TransactionType::Refund,
            'direction' => TransactionDirection::Debit,
            'status' => TransactionStatus::Success,
        ]);
    }
}
