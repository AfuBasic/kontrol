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
use Illuminate\Support\Facades\DB;

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

        $pendingToday = $this->baseQuery($estate)
            ->whereDate('created_at', $today)
            ->where('status', TransactionStatus::Pending)
            ->count();

        $failedToday = $this->baseQuery($estate)
            ->whereDate('failed_at', $today)
            ->where('status', TransactionStatus::Failed)
            ->count();

        $paymentsToday = $this->baseQuery($estate)
            ->whereDate('paid_at', $today)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->count();

        return [
            'payments_today' => $paymentsToday,
            'money_in_today' => (int) $moneyInToday,
            'pending_today' => $pendingToday,
            'failed_today' => $failedToday,
        ];
    }

    /**
     * @return SupportCollection<int, array<string, mixed>>
     */
    public function timeline(Estate $estate, array $filters = [], int $limit = 12): SupportCollection
    {
        return $this->timelinePage($estate, $filters, null, $limit)['entries'];
    }

    /**
     * One page of the activity feed, newest first.
     *
     * Keyset (cursor) pagination on (effective time, id): new payments arriving while someone is
     * scrolling never shift rows, so nothing is repeated or skipped the way offset pages would.
     *
     * @return array{entries: SupportCollection<int, array<string, mixed>>, next_cursor: string|null}
     */
    public function timelinePage(Estate $estate, array $filters = [], ?string $cursor = null, int $limit = 25): array
    {
        $effective = 'COALESCE(paid_at, failed_at, reversed_at, created_at)';

        $query = $this->query($estate, $filters)
            ->reorder()
            ->select('estate_transactions.*')
            ->selectRaw("{$effective} as occurred_sort")
            ->whereNot('status', TransactionStatus::Pending);

        if ($decoded = $this->decodeCursor($cursor)) {
            [$time, $id] = $decoded;

            $query->where(function (Builder $q) use ($effective, $time, $id) {
                $q->whereRaw("{$effective} < ?", [$time])
                    ->orWhere(fn (Builder $same) => $same->whereRaw("{$effective} = ?", [$time])->where('estate_transactions.id', '<', $id));
            });
        }

        $rows = $query
            ->orderByRaw("{$effective} DESC")
            ->orderByDesc('estate_transactions.id')
            ->limit($limit + 1)
            ->get();

        $page = $rows->take($limit);
        $last = $page->last();

        return [
            'entries' => $page->map(fn (EstateTransaction $transaction) => $this->formatTimelineEntry($transaction))->values(),
            'next_cursor' => $rows->count() > $limit && $last ? $this->encodeCursor((string) $last->occurred_sort, (int) $last->id) : null,
        ];
    }

    private function encodeCursor(string $time, int $id): string
    {
        return rtrim(strtr(base64_encode(json_encode([$time, $id])), '+/', '-_'), '=');
    }

    /**
     * @return array{0: string, 1: int}|null
     */
    private function decodeCursor(?string $cursor): ?array
    {
        if (! $cursor) {
            return null;
        }

        $decoded = json_decode((string) base64_decode(strtr($cursor, '-_', '+/'), true), true);

        if (! is_array($decoded) || count($decoded) !== 2 || ! is_string($decoded[0]) || ! is_numeric($decoded[1])) {
            return null;
        }

        return [$decoded[0], (int) $decoded[1]];
    }

    /** Failed and stuck payments are only worth a look for this long. */
    private const ATTENTION_DAYS = 7;

    /** A payment still "pending" after this long is probably abandoned or missing its webhook. */
    private const STUCK_AFTER_HOURS = 2;

    /**
     * What an estate admin should look at: payments that failed or stalled and were never made good.
     * A later successful payment by the same resident for the same charge counts as resolved.
     *
     * @return array{failed: array{count: int, amount: int}, stuck: array{count: int, amount: int}}
     */
    public function attention(Estate $estate): array
    {
        $summarise = function (string $kind) use ($estate): array {
            $query = $this->baseQuery($estate);
            $this->applyAttention($query, $kind);

            return ['count' => (clone $query)->count(), 'amount' => (int) (clone $query)->sum('amount')];
        };

        return ['failed' => $summarise('failed'), 'stuck' => $summarise('stuck')];
    }

    private function applyAttention(Builder $query, string $kind): void
    {
        $attempted = 'COALESCE(estate_transactions.failed_at, estate_transactions.created_at)';

        match ($kind) {
            'failed' => $query
                ->where('estate_transactions.status', TransactionStatus::Failed)
                ->whereRaw("{$attempted} >= ?", [now()->subDays(self::ATTENTION_DAYS)]),
            'stuck' => $query
                ->where('estate_transactions.status', TransactionStatus::Pending)
                ->where('estate_transactions.created_at', '<=', now()->subHours(self::STUCK_AFTER_HOURS))
                ->where('estate_transactions.created_at', '>=', now()->subDays(self::ATTENTION_DAYS)),
            default => $query->whereRaw('1 = 0'),
        };

        if (in_array($kind, ['failed', 'stuck'], true)) {
            $query->whereNotExists(fn ($later) => $later->selectRaw('1')
                ->from('estate_transactions as later')
                ->whereColumn('later.user_id', 'estate_transactions.user_id')
                ->whereColumn('later.collection_assignment_id', 'estate_transactions.collection_assignment_id')
                ->where('later.status', TransactionStatus::Success->value)
                ->where('later.direction', TransactionDirection::Credit->value)
                ->whereRaw("later.paid_at >= {$attempted}"));
        }
    }

    /**
     * The numbers behind the page header and the Reports tab: a 30-day pulse against the 30 days
     * before it, daily money flow, how far each collection has got, when residents pay, and how.
     *
     * @return array<string, mixed>
     */
    public function insights(Estate $estate): array
    {
        $today = Carbon::today();
        $windowStart = $today->copy()->subDays(59);
        $effective = 'COALESCE(paid_at, reversed_at, created_at)';

        // Money collected per day for the last 60 days (30 current + 30 previous). A payment either succeeds or fails.
        $byDay = [];
        $this->baseQuery($estate)
            ->where('status', TransactionStatus::Success)
            ->whereRaw("{$effective} >= ?", [$windowStart])
            ->where('direction', TransactionDirection::Credit)
            ->selectRaw("DATE({$effective}) as day, SUM(amount) as total")
            ->groupByRaw("DATE({$effective})")
            ->get()
            ->each(function ($row) use (&$byDay) {
                $byDay[Carbon::parse($row->day)->toDateString()] = (int) $row->total;
            });

        $flow = [];
        $previousCollected = 0;
        $collected = 0;

        for ($i = 59; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i)->toDateString();
            $in = $byDay[$date] ?? 0;

            if ($i >= 30) {
                $previousCollected += $in;

                continue;
            }

            $collected += $in;
            $flow[] = ['date' => $date, 'money_in' => $in];
        }

        // Success rate: of the payments that resolved in the last 30 days, how many went through.
        $since = $today->copy()->subDays(29);
        $succeeded = $this->baseQuery($estate)
            ->where('status', TransactionStatus::Success)
            ->where('direction', TransactionDirection::Credit)
            ->whereRaw("{$effective} >= ?", [$since])
            ->count();
        $failed = $this->baseQuery($estate)
            ->where('status', TransactionStatus::Failed)
            ->whereRaw('COALESCE(failed_at, created_at) >= ?', [$since])
            ->count();

        $payers = $this->baseQuery($estate)
            ->where('status', TransactionStatus::Success)
            ->where('direction', TransactionDirection::Credit)
            ->whereRaw("{$effective} >= ?", [$since])
            ->selectRaw('COUNT(DISTINCT user_id) as residents, COUNT(*) as payments')
            ->first();
        $payments = (int) ($payers->payments ?? 0);

        // What is still owed across every open charge, and how much of it is already late.
        $owed = DB::table('collection_assignments')
            ->where('estate_id', $estate->id)
            ->where('status', '!=', 'paid')
            ->selectRaw(
                'COALESCE(SUM(amount_due - amount_paid), 0) as outstanding,
                 COALESCE(SUM(CASE WHEN status = ? OR (status = ? AND COALESCE(grace_until, due_date) < ?) THEN amount_due - amount_paid ELSE 0 END), 0) as overdue',
                ['overdue', 'partial', $today->toDateString()],
            )
            ->first();

        $collections = DB::table('collection_assignments as a')
            ->join('collections as c', 'c.id', '=', 'a.collection_id')
            ->where('a.estate_id', $estate->id)
            ->groupBy('a.collection_id', 'c.name')
            ->havingRaw('SUM(a.amount_due) > 0')
            ->orderByRaw('SUM(a.amount_due) - SUM(a.amount_paid) DESC')
            ->limit(6)
            ->selectRaw('a.collection_id as id, c.name, SUM(a.amount_due) as due, SUM(a.amount_paid) as paid')
            ->get()
            ->map(fn ($row) => ['id' => (int) $row->id, 'name' => $row->name, 'due' => (int) $row->due, 'paid' => (int) $row->paid])
            ->all();

        $methods = $this->baseQuery($estate)
            ->where('status', TransactionStatus::Success)
            ->where('direction', TransactionDirection::Credit)
            ->whereRaw("{$effective} >= ?", [$since])
            ->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as n')
            ->groupBy('payment_method')
            ->orderByRaw('SUM(amount) DESC')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->payment_method?->label() ?? 'Other',
                'amount' => (int) $row->total,
                'count' => (int) $row->n,
            ])
            ->all();

        // When residents pay: weekday (Mon-Sun) by four-hour block, over the last 90 days.
        $rhythm = array_fill(0, 7, array_fill(0, 6, 0));
        $this->baseQuery($estate)
            ->where('status', TransactionStatus::Success)
            ->where('direction', TransactionDirection::Credit)
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', $today->copy()->subDays(90))
            ->latest('paid_at')
            ->limit(20000)
            ->pluck('paid_at')
            ->each(function ($paidAt) use (&$rhythm) {
                $rhythm[$paidAt->dayOfWeekIso - 1][intdiv($paidAt->hour, 4)]++;
            });

        return [
            'pulse' => [
                'collected' => [
                    'value' => $collected,
                    'previous' => $previousCollected,
                    'delta_pct' => $previousCollected > 0 ? round(($collected - $previousCollected) / $previousCollected * 100, 1) : null,
                    'spark' => array_column($flow, 'money_in'),
                ],
                'residents_paid' => [
                    'residents' => (int) ($payers->residents ?? 0),
                    'payments' => $payments,
                    'average' => $payments > 0 ? intdiv($collected, max(1, $payments)) : null,
                ],
                'success_rate' => [
                    'pct' => ($succeeded + $failed) > 0 ? round($succeeded / ($succeeded + $failed) * 100, 1) : null,
                    'succeeded' => $succeeded,
                    'failed' => $failed,
                ],
                'outstanding' => [
                    'value' => (int) ($owed->outstanding ?? 0),
                    'overdue' => (int) ($owed->overdue ?? 0),
                ],
            ],
            'flow' => $flow,
            'collections' => $collections,
            'methods' => $methods,
            'rhythm' => ['matrix' => $rhythm, 'max' => max(array_map('max', $rhythm))],
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

        if (! empty($filters['attention'])) {
            $this->applyAttention($query, (string) $filters['attention']);
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
                'ulid' => $transaction->user->ulid,
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
                ->where('created_at', '<', $transaction->created_at)
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
            $totalPaidToDateKobo = $previousTotal + $currentPaymentKobo;
            $remainingBalanceKobo = max(0, $originalBillKobo - $totalPaidToDateKobo);
            $isPartial = $remainingBalanceKobo > 0;

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
        return EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->whereNull('invoice_id')
            ->whereNot('type', TransactionType::SubscriptionPayment);
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
