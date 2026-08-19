<?php

namespace App\Services\Ledger;

use App\Enums\PaymentMethod;
use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateTransaction;
use App\Models\EstateTransactionAudit;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LedgerService
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function record(array $context): EstateTransaction
    {
        return DB::transaction(function () use ($context) {
            $idempotencyKey = $context['idempotency_key'] ?? throw new \InvalidArgumentException('idempotency_key is required');

            $existing = EstateTransaction::query()
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                return $this->syncExisting($existing, $context);
            }

            $type = $context['type'] instanceof TransactionType
                ? $context['type']
                : TransactionType::from($context['type']);

            $direction = $context['direction'] ?? ($type->isOutbound()
                ? TransactionDirection::Debit
                : TransactionDirection::Credit);

            if (! $direction instanceof TransactionDirection) {
                $direction = TransactionDirection::from($direction);
            }

            $status = $context['status'] ?? TransactionStatus::Success;
            if (! $status instanceof TransactionStatus) {
                $status = TransactionStatus::from($status);
            }

            $paymentMethod = $context['payment_method'] ?? null;
            if ($paymentMethod !== null && ! $paymentMethod instanceof PaymentMethod) {
                $paymentMethod = PaymentMethod::from($paymentMethod);
            }

            $transaction = EstateTransaction::create([
                'estate_id' => $context['estate_id'],
                'user_id' => $context['user_id'] ?? null,
                'collection_id' => $context['collection_id'] ?? null,
                'collection_assignment_id' => $context['collection_assignment_id'] ?? null,
                'invoice_id' => $context['invoice_id'] ?? null,
                'created_by' => $context['created_by'] ?? auth()->id(),
                'approved_by' => $context['approved_by'] ?? null,
                'parent_id' => $context['parent_id'] ?? null,
                'type' => $type,
                'direction' => $direction,
                'amount' => (int) $context['amount'],
                'currency' => $context['currency'] ?? 'NGN',
                'status' => $status,
                'payment_method' => $paymentMethod,
                'provider' => $context['provider'] ?? null,
                'reference_number' => $context['reference_number'] ?? $this->generateReferenceNumber(),
                'gateway_reference' => $context['gateway_reference'] ?? null,
                'receipt_number' => $context['receipt_number'] ?? null,
                'description' => $context['description'] ?? $type->label(),
                'reason' => $context['reason'] ?? null,
                'coupon_code' => $context['coupon_code'] ?? null,
                'metadata' => $context['metadata'] ?? null,
                'gateway_response' => $context['gateway_response'] ?? null,
                'source_type' => $context['source_type'] ?? null,
                'source_id' => $context['source_id'] ?? null,
                'idempotency_key' => $idempotencyKey,
                'paid_at' => $context['paid_at'] ?? ($status === TransactionStatus::Success ? now() : null),
                'failed_at' => $context['failed_at'] ?? ($status === TransactionStatus::Failed ? now() : null),
                'reversed_at' => $context['reversed_at'] ?? null,
            ]);

            $this->audit($transaction, 'created', null, $transaction->toArray(), $context['audit_reason'] ?? null);

            return $transaction;
        });
    }

    public function recordFromPayment(Payment $payment): EstateTransaction
    {
        $payment->loadMissing(['assignment.collection', 'user']);

        $type = match ($payment->status) {
            'initiated' => TransactionType::PendingPayment,
            'failed' => TransactionType::FailedPayment,
            default => $payment->provider === 'manual' ? TransactionType::OfflinePayment : TransactionType::CollectionPayment,
        };

        $status = match ($payment->status) {
            'initiated' => TransactionStatus::Pending,
            'failed' => TransactionStatus::Failed,
            default => TransactionStatus::Success,
        };

        $paymentMethod = match ($payment->provider) {
            'manual' => PaymentMethod::Manual,
            'paystack' => PaymentMethod::Paystack,
            default => PaymentMethod::Online,
        };

        return $this->record([
            'idempotency_key' => 'payment_'.$payment->id,
            'estate_id' => $payment->estate_id,
            'user_id' => $payment->user_id,
            'collection_id' => $payment->assignment?->collection_id,
            'collection_assignment_id' => $payment->collection_assignment_id,
            'type' => $type,
            'direction' => TransactionDirection::Credit,
            'amount' => $payment->amount * 100,
            'status' => $status,
            'payment_method' => $paymentMethod,
            'provider' => $payment->provider,
            'gateway_reference' => $payment->reference,
            'description' => $payment->assignment?->collection?->name ?? 'Collection Payment',
            'metadata' => $payment->raw_payload,
            'source_type' => Payment::class,
            'source_id' => $payment->id,
            'paid_at' => $payment->paid_at,
            'failed_at' => $status === TransactionStatus::Failed ? ($payment->updated_at ?? now()) : null,
        ]);
    }

    public function recordFromPaymentTransaction(PaymentTransaction $paymentTransaction): EstateTransaction
    {
        $paymentTransaction->loadMissing(['invoice', 'user']);

        $metadata = $paymentTransaction->metadata ?? [];
        $couponCode = $metadata['coupon_code'] ?? null;

        $type = match ($paymentTransaction->status) {
            'pending' => TransactionType::PendingPayment,
            'failed' => TransactionType::FailedPayment,
            default => $paymentTransaction->invoice_id
                ? TransactionType::SubscriptionPayment
                : TransactionType::CardPayment,
        };

        $status = match ($paymentTransaction->status) {
            'pending' => TransactionStatus::Pending,
            'failed' => TransactionStatus::Failed,
            default => TransactionStatus::Success,
        };

        return $this->record([
            'idempotency_key' => 'payment_transaction_'.$paymentTransaction->id,
            'estate_id' => $paymentTransaction->estate_id,
            'user_id' => $paymentTransaction->user_id,
            'invoice_id' => $paymentTransaction->invoice_id,
            'type' => $couponCode ? TransactionType::CouponRedemption : $type,
            'direction' => TransactionDirection::Credit,
            'amount' => (int) $paymentTransaction->amount,
            'status' => $status,
            'payment_method' => $this->mapPaymentMethod($paymentTransaction->payment_method),
            'provider' => $paymentTransaction->provider,
            'gateway_reference' => $paymentTransaction->paystack_reference,
            'description' => $paymentTransaction->invoice?->invoice_number
                ? 'Invoice '.$paymentTransaction->invoice->invoice_number
                : 'Subscription Payment',
            'coupon_code' => $couponCode,
            'metadata' => $metadata,
            'source_type' => PaymentTransaction::class,
            'source_id' => $paymentTransaction->id,
            'paid_at' => $paymentTransaction->verified_at ?? $paymentTransaction->recorded_at,
            'failed_at' => $status === TransactionStatus::Failed ? ($paymentTransaction->updated_at ?? now()) : null,
        ]);
    }

    public function recordOfflinePayment(CollectionAssignment $assignment, int $amountNaira, string $method, ?User $recordedBy = null): EstateTransaction
    {
        return $this->record([
            'idempotency_key' => 'offline_'.Str::ulid(),
            'estate_id' => $assignment->estate_id,
            'user_id' => $assignment->user_id,
            'collection_id' => $assignment->collection_id,
            'collection_assignment_id' => $assignment->id,
            'created_by' => $recordedBy?->id ?? auth()->id(),
            'type' => TransactionType::OfflinePayment,
            'direction' => TransactionDirection::Credit,
            'amount' => $amountNaira * 100,
            'status' => TransactionStatus::Success,
            'payment_method' => PaymentMethod::from($method === 'cash' ? 'cash' : 'offline'),
            'provider' => 'manual',
            'description' => $assignment->collection?->name ?? 'Offline Payment',
            'metadata' => ['method' => $method],
        ]);
    }

    public function recordAdjustment(
        EstateTransaction $parent,
        TransactionType $type,
        int $amountKobo,
        string $reason,
        ?User $approvedBy = null,
    ): EstateTransaction {
        $direction = $type->isOutbound() ? TransactionDirection::Debit : TransactionDirection::Credit;

        return $this->record([
            'idempotency_key' => 'adjustment_'.Str::ulid(),
            'estate_id' => $parent->estate_id,
            'user_id' => $parent->user_id,
            'collection_id' => $parent->collection_id,
            'collection_assignment_id' => $parent->collection_assignment_id,
            'invoice_id' => $parent->invoice_id,
            'created_by' => auth()->id(),
            'approved_by' => $approvedBy?->id,
            'parent_id' => $parent->id,
            'type' => $type,
            'direction' => $direction,
            'amount' => $amountKobo,
            'status' => TransactionStatus::Success,
            'payment_method' => PaymentMethod::System,
            'provider' => 'system',
            'description' => $type->label(),
            'reason' => $reason,
            'metadata' => ['parent_reference' => $parent->reference_number],
        ]);
    }

    public function issueRefund(EstateTransaction $parent, int $amountKobo, string $reason, ?User $approvedBy = null): EstateTransaction
    {
        $refund = $this->recordAdjustment($parent, TransactionType::Refund, $amountKobo, $reason, $approvedBy);

        $this->updateStatus($parent, TransactionStatus::Reversed, 'Refunded: '.$reason, [
            'reversed_at' => now()->toDateTimeString(),
        ]);

        return $refund;
    }

    /**
     * @param  array<string, mixed>  $changes
     */
    public function updateStatus(EstateTransaction $transaction, TransactionStatus $status, ?string $reason = null, array $changes = []): EstateTransaction
    {
        return DB::transaction(function () use ($transaction, $status, $reason, $changes) {
            $previous = $transaction->only(['status', 'paid_at', 'failed_at', 'reversed_at']);

            $transaction->update(array_merge([
                'status' => $status,
                'paid_at' => $status === TransactionStatus::Success ? ($changes['paid_at'] ?? now()) : $transaction->paid_at,
                'failed_at' => $status === TransactionStatus::Failed ? ($changes['failed_at'] ?? now()) : $transaction->failed_at,
                'reversed_at' => $status === TransactionStatus::Reversed ? ($changes['reversed_at'] ?? now()) : $transaction->reversed_at,
            ], $changes));

            $this->audit($transaction, 'status_updated', $previous, $transaction->only(['status', 'paid_at', 'failed_at', 'reversed_at']), $reason);

            return $transaction->fresh();
        });
    }

    /**
     * @param  array<string, mixed>|null  $previous
     * @param  array<string, mixed>|null  $current
     */
    public function audit(
        EstateTransaction $transaction,
        string $action,
        ?array $previous,
        ?array $current,
        ?string $reason = null,
    ): EstateTransactionAudit {
        return EstateTransactionAudit::create([
            'estate_transaction_id' => $transaction->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'reason' => $reason,
            'previous_values' => $previous,
            'current_values' => $current,
        ]);
    }

    public function generateReferenceNumber(): string
    {
        $latestId = EstateTransaction::query()->max('id') ?? 0;

        return 'KTR-'.str_pad((string) ($latestId + 1), 6, '0', STR_PAD_LEFT);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function syncExisting(EstateTransaction $transaction, array $context): EstateTransaction
    {
        $previous = $transaction->toArray();

        $status = $context['status'] ?? $transaction->status;
        if (! $status instanceof TransactionStatus) {
            $status = TransactionStatus::from($status);
        }

        $type = $context['type'] ?? $transaction->type;
        if (! $type instanceof TransactionType) {
            $type = TransactionType::from($type);
        }

        $transaction->update([
            'type' => $type,
            'status' => $status,
            'amount' => (int) ($context['amount'] ?? $transaction->amount),
            'gateway_reference' => $context['gateway_reference'] ?? $transaction->gateway_reference,
            'metadata' => $context['metadata'] ?? $transaction->metadata,
            'gateway_response' => $context['gateway_response'] ?? $transaction->gateway_response,
            'paid_at' => $context['paid_at'] ?? $transaction->paid_at,
            'failed_at' => $context['failed_at'] ?? $transaction->failed_at,
        ]);

        $this->audit($transaction, 'synced', $previous, $transaction->fresh()->toArray(), $context['audit_reason'] ?? null);

        return $transaction->fresh();
    }

    public function backfillEstate(Estate $estate): int
    {
        $synced = 0;

        Payment::query()
            ->where('estate_id', $estate->id)
            ->chunkById(200, function ($payments) use (&$synced) {
                foreach ($payments as $payment) {
                    $this->recordFromPayment($payment);
                    $synced++;
                }
            });

        PaymentTransaction::query()
            ->where('estate_id', $estate->id)
            ->chunkById(200, function ($transactions) use (&$synced) {
                foreach ($transactions as $transaction) {
                    $this->recordFromPaymentTransaction($transaction);
                    $synced++;
                }
            });

        return $synced;
    }

    public function ensureEstateLedgerSynced(Estate $estate): int
    {
        if (EstateTransaction::query()->where('estate_id', $estate->id)->exists()) {
            return 0;
        }

        $hasSourceData = Payment::query()->where('estate_id', $estate->id)->exists()
            || PaymentTransaction::query()->where('estate_id', $estate->id)->exists();

        if (! $hasSourceData) {
            return 0;
        }

        return $this->backfillEstate($estate);
    }

    private function mapPaymentMethod(?string $method): PaymentMethod
    {
        return match ($method) {
            'card' => PaymentMethod::Card,
            'bank_transfer', 'bank' => PaymentMethod::BankTransfer,
            'manual' => PaymentMethod::Manual,
            default => PaymentMethod::Online,
        };
    }
}
