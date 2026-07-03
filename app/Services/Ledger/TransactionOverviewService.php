<?php

namespace App\Services\Ledger;

use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateTransaction;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection as SupportCollection;

class TransactionOverviewService
{
    /**
     * @return array<string, mixed>
     */
    public function heroMetrics(Estate $estate): array
    {
        $today = Carbon::today();
        $todayQuery = $this->baseQuery($estate)->whereDate('created_at', $today);

        $moneyInToday = (clone $todayQuery)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->sum('amount');

        $moneyOutToday = (clone $todayQuery)
            ->where('direction', TransactionDirection::Debit)
            ->where('status', TransactionStatus::Success)
            ->sum('amount');

        $statusCounts = $this->baseQuery($estate)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $refundsToday = (clone $todayQuery)
            ->where('type', TransactionType::Refund)
            ->sum('amount');

        $outstanding = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->selectRaw('SUM(amount_due - amount_paid) as outstanding')
            ->value('outstanding') ?? 0;

        $collectionHealth = $this->collectionHealth($estate);

        return [
            'money_in_today' => (int) $moneyInToday,
            'money_out_today' => (int) $moneyOutToday,
            'net_movement_today' => (int) $moneyInToday - (int) $moneyOutToday,
            'successful_count' => (int) ($statusCounts[TransactionStatus::Success->value] ?? 0),
            'pending_count' => (int) ($statusCounts[TransactionStatus::Pending->value] ?? 0),
            'failed_count' => (int) ($statusCounts[TransactionStatus::Failed->value] ?? 0),
            'refunds_today' => (int) $refundsToday,
            'outstanding_balance' => (int) $outstanding * 100,
            'collection_health' => $collectionHealth,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function collectionHealth(Estate $estate): array
    {
        $activeCollections = Collection::query()
            ->where('estate_id', $estate->id)
            ->where('status', 'active')
            ->count();

        if ($activeCollections === 0) {
            return [
                'score' => 100,
                'level' => 'excellent',
                'label' => 'Excellent',
                'interpretation' => 'No active collections requiring attention.',
                'projected_completion' => null,
            ];
        }

        $assignments = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->whereHas('collection', fn (Builder $q) => $q->where('status', 'active'))
            ->get();

        $totalDue = $assignments->sum('amount_due');
        $totalPaid = $assignments->sum('amount_paid');
        $completionRate = $totalDue > 0 ? ($totalPaid / $totalDue) * 100 : 100;

        $overdueCount = $assignments->where('status', 'overdue')->count();
        $overdueRate = $assignments->count() > 0 ? ($overdueCount / $assignments->count()) * 100 : 0;

        $recentPayments = EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $velocityScore = min(100, $recentPayments * 5);
        $score = (int) round(
            ($completionRate * 0.45)
            + (max(0, 100 - $overdueRate * 2) * 0.35)
            + ($velocityScore * 0.20)
        );

        $level = match (true) {
            $score >= 85 => 'excellent',
            $score >= 70 => 'healthy',
            $score >= 50 => 'needs_attention',
            default => 'critical',
        };

        $label = match ($level) {
            'excellent' => 'Excellent',
            'healthy' => 'Healthy',
            'needs_attention' => 'Needs Attention',
            default => 'Critical',
        };

        $interpretation = match ($level) {
            'excellent' => 'Collections are progressing ahead of schedule.',
            'healthy' => 'Collections are on track with steady payment activity.',
            'needs_attention' => 'Collections are slowing down. Consider sending reminders today.',
            default => 'Collections require immediate attention. Multiple overdue payments detected.',
        };

        $remaining = max(0, $totalDue - $totalPaid);
        $dailyVelocity = max(1, $recentPayments > 0
            ? (int) ($assignments->avg('amount_due') ?? 0)
            : 0);
        $daysToComplete = $dailyVelocity > 0 ? (int) ceil($remaining / $dailyVelocity) : null;

        return [
            'score' => $score,
            'level' => $level,
            'label' => $label,
            'interpretation' => $interpretation,
            'completion_rate' => round($completionRate, 1),
            'overdue_count' => $overdueCount,
            'projected_completion' => $daysToComplete
                ? now()->addDays($daysToComplete)->toDateString()
                : null,
        ];
    }

    /**
     * @return SupportCollection<int, array<string, mixed>>
     */
    public function timeline(Estate $estate, int $limit = 20): SupportCollection
    {
        return $this->baseQuery($estate)
            ->with(['user:id,name,email', 'collection:id,name', 'creator:id,name'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (EstateTransaction $transaction) => $this->formatTimelineEntry($transaction));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function moneyFlow(Estate $estate, int $days = 30): array
    {
        $start = now()->subDays($days - 1)->startOfDay();

        $transactions = $this->baseQuery($estate)
            ->where('created_at', '>=', $start)
            ->where('status', TransactionStatus::Success)
            ->get();

        $flow = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $flow[$date] = [
                'date' => $date,
                'money_in' => 0,
                'refunds' => 0,
                'adjustments' => 0,
                'money_out' => 0,
                'net_revenue' => 0,
            ];
        }

        foreach ($transactions as $transaction) {
            $date = $transaction->created_at->toDateString();
            if (! isset($flow[$date])) {
                continue;
            }

            if ($transaction->type === TransactionType::Refund) {
                $flow[$date]['refunds'] += $transaction->amount;
            } elseif (in_array($transaction->type, [TransactionType::ManualAdjustment, TransactionType::Debit, TransactionType::Credit], true)) {
                $flow[$date]['adjustments'] += $transaction->amount;
            } elseif ($transaction->direction === TransactionDirection::Credit) {
                $flow[$date]['money_in'] += $transaction->amount;
            } elseif ($transaction->direction === TransactionDirection::Debit) {
                $flow[$date]['money_out'] += $transaction->amount;
            }
        }

        foreach ($flow as &$day) {
            $day['net_revenue'] = $day['money_in'] - $day['refunds'] - $day['adjustments'] - $day['money_out'];
        }

        return array_values($flow);
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

        if (! empty($filters['amount_min'])) {
            $query->where('amount', '>=', (int) $filters['amount_min']);
        }

        if (! empty($filters['amount_max'])) {
            $query->where('amount', '<=', (int) $filters['amount_max']);
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
                'amount_due' => $transaction->assignment->amount_due,
                'amount_paid' => $transaction->assignment->amount_paid,
                'status' => $transaction->assignment->status,
            ] : null,
            'invoice' => $transaction->invoice ? [
                'id' => $transaction->invoice->id,
                'invoice_number' => $transaction->invoice->invoice_number,
                'amount' => $transaction->invoice->amount,
            ] : null,
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
        return [
            'id' => $transaction->ulid,
            'type' => $transaction->type->value,
            'type_label' => $transaction->type->label(),
            'direction' => $transaction->direction->value,
            'status' => $transaction->status->value,
            'amount' => $transaction->amount,
            'description' => $transaction->description,
            'reason' => $transaction->reason,
            'reference_number' => $transaction->reference_number,
            'payment_method_label' => $transaction->payment_method?->label(),
            'resident_name' => $transaction->user?->name,
            'collection_name' => $transaction->collection?->name,
            'coupon_code' => $transaction->coupon_code,
            'created_by_name' => $transaction->creator?->name,
            'created_at' => $transaction->created_at?->toIso8601String(),
        ];
    }
}
