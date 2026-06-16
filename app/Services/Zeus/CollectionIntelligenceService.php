<?php

namespace App\Services\Zeus;

use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Payment;
use App\Models\ResidentSubscription;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CollectionIntelligenceService
{
    /**
     * Get global metrics for all collections.
     */
    public function getGlobalMetrics(): array
    {
        $totalExpected = CollectionAssignment::sum('amount_due');
        $totalPaid = CollectionAssignment::sum('amount_paid');

        // Identify users who currently have an active subscription
        $activeSubscribersIds = ResidentSubscription::whereIn('status', ['active', 'trial', 'past_due'])
            ->where(function ($query) {
                $query->whereNull('current_period_end')
                    ->orWhere('current_period_end', '>=', now());
            })
            ->pluck('user_id')
            ->unique()
            ->toArray();

        // Platform revenue is ONLY generated from users who do NOT have an active subscription.
        // Expected:
        $expectedPlatformRevenue = CollectionAssignment::whereNotIn('user_id', $activeSubscribersIds)
            ->whereColumn('amount_due', '>', 'amount_paid')
            ->selectRaw('SUM((amount_due - amount_paid) * 0.005) as expected_fee')
            ->value('expected_fee') ?? 0;

        // Realized platform revenue: accurately calculated using recorded fees.
        $realizedPlatformRevenue = CollectionAssignment::sum('kontrol_fee_paid') ?? 0;

        // Lost platform revenue from manual payments by non-subscribed users.
        $lostPlatformRevenue = Payment::where('provider', '!=', 'paystack')
            ->where('status', 'success')
            ->whereNotNull('collection_assignment_id')
            ->whereNotIn('user_id', $activeSubscribersIds)
            ->sum('amount') * 0.005;

        $activeCollectionsCount = Collection::where('status', 'active')->count();

        return [
            'total_expected' => (int) $totalExpected,
            'total_paid' => (int) $totalPaid,
            'active_collections' => $activeCollectionsCount,
            'expected_platform_revenue' => (int) $expectedPlatformRevenue,
            'realized_platform_revenue' => (int) $realizedPlatformRevenue,
            'lost_platform_revenue' => (int) $lostPlatformRevenue,
        ];
    }

    /**
     * Get a paginated list of all active collections globally with their metrics.
     */
    public function getGlobalCollections(array $filters = []): LengthAwarePaginator
    {
        $query = Collection::with('estate:id,name')
            ->withCount('assignments')
            ->where('status', 'active');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('estate', function ($eq) use ($search) {
                        $eq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $collections = $query->latest()->paginate(15);

        // Pre-fetch active subscriber IDs for accurate platform fee calculation
        $activeSubscribersIds = ResidentSubscription::whereIn('status', ['active', 'trial', 'past_due'])
            ->where(function ($query) {
                $query->whereNull('current_period_end')
                    ->orWhere('current_period_end', '>=', now());
            })
            ->pluck('user_id')
            ->unique()
            ->toArray();

        $collections->getCollection()->transform(function ($collection) {
            $assignments = $collection->assignments();
            $expected = $assignments->sum('amount_due');
            $paid = $assignments->sum('amount_paid');

            // Realized platform fee for this specific collection
            $platformFeeEarned = clone $assignments;
            $platformFeeEarned = $platformFeeEarned->sum('kontrol_fee_paid') ?? 0;

            return [
                'id' => $collection->id,
                'name' => $collection->name,
                'estate_name' => $collection->estate->name ?? 'Unknown',
                'estate_id' => $collection->estate_id,
                'targets_count' => $collection->assignments_count,
                'amount_expected' => (int) $expected,
                'amount_paid' => (int) $paid,
                'platform_fee_earned' => (int) $platformFeeEarned,
                'completion_rate' => $expected > 0 ? round(($paid / $expected) * 100, 1) : 0,
            ];
        });

        return $collections;
    }

    /**
     * Get top performing estates by platform revenue.
     */
    public function getTopEstatesByRevenue(int $limit = 5): array
    {
        $topEstates = CollectionAssignment::select(
            'estate_id',
            DB::raw('SUM(amount_paid) as volume_processed'),
            DB::raw('SUM(kontrol_fee_paid) as platform_revenue')
        )
            ->where('kontrol_fee_paid', '>', 0)
            ->groupBy('estate_id')
            ->orderByDesc('platform_revenue')
            ->limit($limit)
            ->with('estate:id,name')
            ->get();

        return $topEstates->map(function ($record) {
            return [
                'estate_name' => $record->estate->name ?? 'Unknown',
                'volume_processed' => (int) $record->volume_processed,
                'platform_revenue' => (int) $record->platform_revenue,
            ];
        })->toArray();
    }

    /**
     * Get global defaulters / worst assignments.
     */
    public function getGlobalDefaulters(int $limit = 10): array
    {
        $activeSubscribersIds = ResidentSubscription::whereIn('status', ['active', 'trial', 'past_due'])
            ->where(function ($query) {
                $query->whereNull('current_period_end')
                    ->orWhere('current_period_end', '>=', now());
            })
            ->pluck('user_id')
            ->unique()
            ->toArray();

        return CollectionAssignment::with(['user:id,name', 'estate:id,name', 'collection:id,name'])
            ->where('status', 'overdue')
            ->whereRaw('amount_due > amount_paid')
            ->orderByDesc(DB::raw('amount_due - amount_paid'))
            ->limit($limit)
            ->get()
            ->map(function ($assignment) use ($activeSubscribersIds) {
                $amountOwed = $assignment->amount_due - $assignment->amount_paid;
                $isSubscriber = in_array($assignment->user_id, $activeSubscribersIds);

                return [
                    'id' => $assignment->id,
                    'resident_name' => $assignment->user->name ?? 'Unknown',
                    'estate_name' => $assignment->estate->name ?? 'Unknown',
                    'collection_name' => $assignment->collection->name ?? 'Unknown',
                    'amount_owed' => $amountOwed,
                    'days_overdue' => Carbon::now()->diffInDays($assignment->due_date),
                    'lost_platform_fee' => $isSubscriber ? 0 : (int) ($amountOwed * 0.005),
                ];
            })
            ->toArray();
    }
}
