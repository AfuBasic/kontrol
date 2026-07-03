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
use Illuminate\Support\Facades\DB;

class TransactionInsightService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function generate(Estate $estate): array
    {
        $insights = [];

        $todayRevenue = $this->revenueForDate($estate, Carbon::today());
        $yesterdayRevenue = $this->revenueForDate($estate, Carbon::yesterday());

        if ($yesterdayRevenue > 0) {
            $change = round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1);
            if (abs($change) >= 1) {
                $insights[] = [
                    'type' => $change >= 0 ? 'positive' : 'negative',
                    'message' => sprintf(
                        "Today's revenue %s by %s%%.",
                        $change >= 0 ? 'increased' : 'decreased',
                        abs($change)
                    ),
                ];
            }
        }

        $topCollection = EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->whereNotNull('collection_id')
            ->where('created_at', '>=', now()->subDays(30))
            ->select('collection_id', DB::raw('COUNT(*) as volume'))
            ->groupBy('collection_id')
            ->orderByDesc('volume')
            ->with('collection:id,name')
            ->first();

        if ($topCollection?->collection) {
            $insights[] = [
                'type' => 'info',
                'message' => $topCollection->collection->name.' has the highest payment volume.',
            ];
        }

        $weekendPayments = EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->where('created_at', '>=', now()->subDays(30))
            ->whereRaw('DAYOFWEEK(created_at) IN (1, 7)')
            ->count();

        $weekdayPayments = EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->where('created_at', '>=', now()->subDays(30))
            ->whereRaw('DAYOFWEEK(created_at) NOT IN (1, 7)')
            ->count();

        if ($weekendPayments > $weekdayPayments * 0.3) {
            $insights[] = [
                'type' => 'info',
                'message' => 'Weekend payments are increasing.',
            ];
        }

        $totalTransactions = EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $refundCount = EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->where('type', TransactionType::Refund)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        if ($totalTransactions > 0) {
            $refundRate = round(($refundCount / $totalTransactions) * 100, 2);
            $insights[] = [
                'type' => $refundRate < 1 ? 'positive' : 'warning',
                'message' => "Refund rate remains at {$refundRate}%.",
            ];
        }

        $avgDays = $this->averagePaymentDays($estate);
        if ($avgDays !== null) {
            $insights[] = [
                'type' => 'info',
                'message' => sprintf('Residents typically pay within %.1f days.', $avgDays),
            ];
        }

        $nearCompletion = Collection::query()
            ->where('estate_id', $estate->id)
            ->where('status', 'active')
            ->get()
            ->first(function (Collection $collection) {
                $assignments = CollectionAssignment::query()
                    ->where('collection_id', $collection->id)
                    ->get();

                if ($assignments->isEmpty()) {
                    return false;
                }

                $completion = $assignments->sum('amount_paid') / max(1, $assignments->sum('amount_due'));

                return $completion >= 0.85 && $completion < 1;
            });

        if ($nearCompletion) {
            $insights[] = [
                'type' => 'positive',
                'message' => $nearCompletion->name.' is projected to complete soon.',
            ];
        }

        return array_slice($insights, 0, 6);
    }

    private function revenueForDate(Estate $estate, Carbon $date): int
    {
        return (int) EstateTransaction::query()
            ->where('estate_id', $estate->id)
            ->where('direction', TransactionDirection::Credit)
            ->where('status', TransactionStatus::Success)
            ->whereDate('created_at', $date)
            ->sum('amount');
    }

    private function averagePaymentDays(Estate $estate): ?float
    {
        $assignments = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->whereNotNull('paid_at')
            ->where('created_at', '>=', now()->subDays(90))
            ->get(['created_at', 'paid_at']);

        if ($assignments->isEmpty()) {
            return null;
        }

        $totalDays = $assignments->sum(fn ($a) => $a->created_at->diffInDays($a->paid_at));

        return round($totalDays / $assignments->count(), 1);
    }
}
