<?php

namespace App\Services\Ledger;

use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Estate;
use App\Models\EstateTransaction;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection as SupportCollection;

class TransactionOverviewService
{
    /**
     * @return array<string, mixed>
     */
    public function todaySummary(Estate $estate): array
    {
        $today = Carbon::today();

        $moneyInToday = $this->baseQuery($estate)
            ->whereDate('paid_at', $today)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->sum('amount');

        $moneyOutToday = $this->baseQuery($estate)
            ->where(function ($query) use ($today) {
                $query->whereDate('reversed_at', $today)
                    ->orWhere(fn ($q) => $q->whereDate('failed_at', $today)->where('direction', TransactionDirection::Debit));
            })
            ->where('status', TransactionStatus::Success)
            ->sum('amount');

        $pendingToday = $this->baseQuery($estate)
            ->whereDate('created_at', $today)
            ->where('status', TransactionStatus::Pending)
            ->count();

        $failedToday = $this->baseQuery($estate)
            ->whereDate('failed_at', $today)
            ->where('status', TransactionStatus::Failed)
            ->count();

        return [
            'money_in_today' => (int) $moneyInToday,
            'money_out_today' => (int) $moneyOutToday,
            'pending_today' => $pendingToday,
            'failed_today' => $failedToday,
        ];
    }

    /**
     * @return SupportCollection<int, array<string, mixed>>
     */
    public function timeline(Estate $estate, array $filters = [], int $limit = 12): SupportCollection
    {
        return $this->query($estate, $filters)
            ->reorder()
            ->whereNot('status', TransactionStatus::Pending)
            ->orderByRaw('COALESCE(paid_at, failed_at, reversed_at, created_at) DESC')
            ->limit($limit)
            ->get()
            ->map(fn (EstateTransaction $transaction) => $this->formatTimelineEntry($transaction));
    }

    /**
     * @return array<string, mixed>
     */
    public function charts(Estate $estate, int $days = 30): array
    {
        $start = now()->subDays($days - 1)->startOfDay();

        $transactions = $this->baseQuery($estate)
            ->where('created_at', '>=', $start)
            ->get();

        $dailyVolume = [];
        $moneyInVsOut = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $dailyVolume[$date] = ['date' => $date, 'count' => 0, 'volume' => 0];
            $moneyInVsOut[$date] = ['date' => $date, 'money_in' => 0, 'money_out' => 0];
        }

        $paymentMethods = [];
        $transactionTypes = [];
        $revenueTrend = [];
        $refundTrend = [];

        foreach ($transactions as $transaction) {
            $date = $transaction->created_at->toDateString();

            if (isset($dailyVolume[$date])) {
                $dailyVolume[$date]['count']++;
                if ($transaction->status === TransactionStatus::Success) {
                    $dailyVolume[$date]['volume'] += $transaction->amount;
                }
            }

            if ($transaction->status === TransactionStatus::Success && isset($moneyInVsOut[$date])) {
                if ($transaction->direction === TransactionDirection::Credit) {
                    $moneyInVsOut[$date]['money_in'] += $transaction->amount;
                } else {
                    $moneyInVsOut[$date]['money_out'] += $transaction->amount;
                }
            }

            if ($transaction->payment_method) {
                $key = $transaction->payment_method->value;
                $paymentMethods[$key] = ($paymentMethods[$key] ?? 0) + 1;
            }

            $typeKey = $transaction->type->value;
            $transactionTypes[$typeKey] = ($transactionTypes[$typeKey] ?? 0) + 1;

            if ($transaction->direction === TransactionDirection::Credit && $transaction->status === TransactionStatus::Success) {
                $revenueTrend[$date] = ($revenueTrend[$date] ?? 0) + $transaction->amount;
            }

            if ($transaction->type === TransactionType::Refund && $transaction->status === TransactionStatus::Success) {
                $refundTrend[$date] = ($refundTrend[$date] ?? 0) + $transaction->amount;
            }
        }

        return [
            'money_in_vs_out' => array_values($moneyInVsOut),
            'daily_volume' => array_values($dailyVolume),
            'payment_methods' => collect($paymentMethods)->map(fn ($count, $method) => [
                'method' => $method,
                'count' => $count,
            ])->values()->all(),
            'transaction_types' => collect($transactionTypes)->map(fn ($count, $type) => [
                'type' => $type,
                'count' => $count,
            ])->values()->all(),
            'revenue_trend' => collect($revenueTrend)->map(fn ($amount, $date) => [
                'date' => $date,
                'amount' => $amount,
            ])->values()->all(),
            'refund_trend' => collect($refundTrend)->map(fn ($amount, $date) => [
                'date' => $date,
                'amount' => $amount,
            ])->values()->all(),
        ];
    }

    public function hasTransactions(Estate $estate): bool
    {
        return $this->baseQuery($estate)->exists();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function query(Estate $estate, array $filters = []): Builder
    {
        $query = $this->baseQuery($estate)
            ->with([
                'user:id,name,email',
                'collection:id,name',
                'creator:id,name',
                'approver:id,name',
            ]);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('gateway_reference', 'like', "%{$search}%")
                    ->orWhere('receipt_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('user', fn (Builder $uq) => $uq
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        if (! empty($filters['resident_id'])) {
            $query->where('user_id', $filters['resident_id']);
        }

        if (! empty($filters['collection_id'])) {
            $query->where('collection_id', $filters['collection_id']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['provider'])) {
            $query->where('provider', $filters['provider']);
        }

        if (! empty($filters['coupon'])) {
            $query->where('coupon_code', $filters['coupon']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (! empty($filters['approved_by'])) {
            $query->where('approved_by', $filters['approved_by']);
        }

        if (isset($filters['amount_min']) && $filters['amount_min'] !== '') {
            $query->where('amount', '>=', (int) $filters['amount_min'] * 100);
        }

        if (isset($filters['amount_max']) && $filters['amount_max'] !== '') {
            $query->where('amount', '<=', (int) $filters['amount_max'] * 100);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->latest();
    }

    /**
     * @return array<string, mixed>
     */
    public function formatTransaction(EstateTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'ulid' => $transaction->ulid,
            'reference_number' => $transaction->reference_number,
            'gateway_reference' => $transaction->gateway_reference,
            'receipt_number' => $transaction->receipt_number,
            'type' => $transaction->type->value,
            'type_label' => $transaction->type->label(),
            'direction' => $transaction->direction->value,
            'amount' => $transaction->amount,
            'status' => $transaction->status->value,
            'status_label' => $transaction->status->label(),
            'payment_method' => $transaction->payment_method?->value,
            'payment_method_label' => $transaction->payment_method?->label(),
            'provider' => $transaction->provider,
            'description' => $transaction->description,
            'reason' => $transaction->reason,
            'coupon_code' => $transaction->coupon_code,
            'created_at' => $transaction->created_at?->toIso8601String(),
            'paid_at' => $transaction->paid_at?->toIso8601String(),
            'resident' => $transaction->user ? [
                'id' => $transaction->user->id,
                'name' => $transaction->user->name,
                'email' => $transaction->user->email,
            ] : null,
            'collection' => $transaction->collection ? [
                'id' => $transaction->collection->id,
                'name' => $transaction->collection->name,
            ] : null,
            'created_by' => $transaction->creator ? [
                'id' => $transaction->creator->id,
                'name' => $transaction->creator->name,
            ] : null,
            'approved_by' => $transaction->approver ? [
                'id' => $transaction->approver->id,
                'name' => $transaction->approver->name,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatDetail(EstateTransaction $transaction): array
    {
        $transaction->load([
            'user',
            'collection',
            'assignment',
            'invoice',
            'creator',
            'approver',
            'children',
            'audits.user',
        ]);

        $paymentBreakdown = null;
        if ($transaction->collection_assignment_id && $transaction->assignment) {
            $assignment = $transaction->assignment;

            $priorTransactions = EstateTransaction::query()
                ->where('collection_assignment_id', $assignment->id)
                ->where('status', TransactionStatus::Success)
                ->where('id', '!=', $transaction->id)
                ->where('created_at', '<=', $transaction->created_at)
                ->orderBy('created_at', 'asc')
                ->get();

            $previousPayments = $priorTransactions->map(function ($tx) {
                return [
                    'reference' => $tx->reference_number,
                    'amount' => $tx->amount,
                    'paid_at' => $tx->paid_at ? $tx->paid_at->format('M j, Y g:i A') : $tx->created_at?->format('M j, Y g:i A'),
                ];
            })->all();

            $previousTotal = (int) $priorTransactions->sum('amount');
            $originalBillKobo = (int) round($assignment->amount_due * 100);
            $currentPaymentKobo = (int) $transaction->amount;
            $totalPaidToDateKobo = (int) round($assignment->amount_paid * 100);
            $remainingBalanceKobo = max(0, $originalBillKobo - $totalPaidToDateKobo);
            $isPartial = $remainingBalanceKobo > 0 || $assignment->status === 'partial';

            $paymentBreakdown = [
                'is_partial' => $isPartial,
                'original_bill_amount' => $originalBillKobo,
                'previous_payments_total' => $previousTotal,
                'previous_payments' => $previousPayments,
                'current_payment_amount' => $currentPaymentKobo,
                'total_paid_to_date' => $totalPaidToDateKobo,
                'remaining_balance' => $remainingBalanceKobo,
            ];
        }

        return array_merge($this->formatTransaction($transaction), [
            'metadata' => $transaction->metadata,
            'gateway_response' => $transaction->gateway_response,
            'related_transactions' => $transaction->children->map(fn (EstateTransaction $child) => $this->formatTransaction($child)),
            'audit_trail' => $transaction->audits->map(fn ($audit) => [
                'id' => $audit->id,
                'action' => $audit->action,
                'reason' => $audit->reason,
                'previous_values' => $audit->previous_values,
                'current_values' => $audit->current_values,
                'user' => $audit->user ? ['id' => $audit->user->id, 'name' => $audit->user->name] : null,
                'created_at' => $audit->created_at?->toIso8601String(),
            ]),
            'assignment' => $transaction->assignment ? [
                'id' => $transaction->assignment->id,
                'amount_due' => (int) round($transaction->assignment->amount_due * 100),
                'amount_paid' => (int) round($transaction->assignment->amount_paid * 100),
                'status' => $transaction->assignment->status,
            ] : null,
            'invoice' => $transaction->invoice ? [
                'id' => $transaction->invoice->id,
                'invoice_number' => $transaction->invoice->invoice_number,
                'amount' => $transaction->invoice->amount,
            ] : null,
            'payment_breakdown' => $paymentBreakdown,
        ]);
    }

    private function baseQuery(Estate $estate): Builder
    {
        return EstateTransaction::query()->where('estate_id', $estate->id);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTimelineEntry(EstateTransaction $transaction): array
    {
        $headline = $this->timelineHeadline($transaction);
        $failureReason = null;

        if ($transaction->status === TransactionStatus::Failed) {
            $metadata = $transaction->metadata ?? [];
            $gateway = $transaction->gateway_response ?? [];
            $failureReason = $metadata['error_message']
                ?? $metadata['message']
                ?? $gateway['message']
                ?? 'Payment failed';
        }

        $occurredAt = $this->occurredAt($transaction);

        return [
            'id' => $transaction->ulid,
            'headline' => $headline,
            'type' => $transaction->type->value,
            'type_label' => $transaction->type->label(),
            'direction' => $transaction->direction->value,
            'status' => $transaction->status->value,
            'amount' => $transaction->amount,
            'description' => $transaction->description,
            'reason' => $transaction->reason,
            'failure_reason' => $failureReason,
            'reference_number' => $transaction->reference_number,
            'payment_method_label' => $transaction->payment_method?->label(),
            'resident_name' => $transaction->user?->name,
            'collection_name' => $transaction->collection?->name,
            'coupon_code' => $transaction->coupon_code,
            'created_by_name' => $transaction->creator?->name,
            'created_at' => $transaction->created_at?->toIso8601String(),
            'occurred_at' => $occurredAt->toIso8601String(),
            'time_ago' => $occurredAt->diffForHumans(),
        ];
    }

    private function occurredAt(EstateTransaction $transaction): CarbonInterface
    {
        return $transaction->paid_at
            ?? $transaction->failed_at
            ?? $transaction->reversed_at
            ?? $transaction->created_at
            ?? now();
    }

    private function timelineHeadline(EstateTransaction $transaction): string
    {
        $action = match ($transaction->type) {
            TransactionType::CollectionPayment, TransactionType::CardPayment, TransactionType::BankTransfer => 'Payment received',
            TransactionType::SubscriptionPayment => 'Subscription payment',
            TransactionType::OfflinePayment => 'Offline payment recorded',
            TransactionType::Refund, TransactionType::ReversedPayment => 'Refund issued',
            TransactionType::CouponRedemption, TransactionType::DiscountApplied => 'Coupon applied',
            TransactionType::ManualAdjustment => 'Manual adjustment',
            TransactionType::FailedPayment => 'Payment failed',
            TransactionType::PendingPayment => 'Payment initiated',
            TransactionType::WaiverGranted => 'Waiver granted',
            default => $transaction->type->label(),
        };

        $context = $transaction->collection?->name
            ?? ($transaction->description !== 'Collection Payment' ? $transaction->description : null);

        if ($context) {
            return $action.' · '.$context;
        }

        return $action.' · '.$transaction->reference_number;
    }
}
