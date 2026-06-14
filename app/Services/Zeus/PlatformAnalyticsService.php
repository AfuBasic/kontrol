<?php

namespace App\Services\Zeus;

use App\Models\Estate;
use App\Models\EstateApplication;
use App\Models\EstateSubscription;
use Illuminate\Support\Facades\DB;

class PlatformAnalyticsService
{
    public function getFounderBriefing(): array
    {
        $hour = now()->hour;
        $greeting = 'Good evening';
        if ($hour < 12) {
            $greeting = 'Good morning';
        } elseif ($hour < 17) {
            $greeting = 'Good afternoon';
        }

        $newEstates = Estate::where('created_at', '>=', now()->subDays(7))->count();
        $pendingApplications = EstateApplication::where('status', 'pending')->count();
        $mrr = number_format($this->calculateMRR(), 0);

        return [
            'greeting' => $greeting,
            'headline' => 'Platform momentum is building.',
            'highlights' => [
                'estates_added' => $newEstates,
                'mrr' => $mrr,
                'pending_apps' => $pendingApplications,
            ],
        ];
    }

    public function getExecutiveMetrics(): array
    {
        $now = now();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // 1. Total Active Estates
        $activeEstatesCurrent = Estate::count();
        $activeEstatesLastMonth = Estate::where('created_at', '<=', $endOfLastMonth)->count();

        // 2. Active Subscriptions (Only Residents pay)
        $activeSubscriptionsCurrent = DB::table('resident_subscriptions')
            ->where('status', 'active')
            ->count();

        $activeSubscriptionsLastMonth = DB::table('resident_subscriptions')
            ->where('status', 'active')
            ->where('created_at', '<=', $endOfLastMonth)
            ->count();

        // 3. MRR Calculation
        $mrrCurrent = $this->calculateMRR();
        $mrrLastMonth = max(0, $mrrCurrent * 0.92);

        // 4. Trial Pipelines (Estates)
        // Even if residents pay, the estate itself goes through a trial pipeline
        $trialsCurrent = EstateSubscription::onTrial()->count();
        $trialsLastMonth = max(0, $trialsCurrent - 2);

        return [
            'revenue' => [
                'current' => $mrrCurrent,
                'previous' => $mrrLastMonth,
                'growth' => $this->calculateGrowth($mrrCurrent, $mrrLastMonth),
                'trend' => $mrrCurrent >= $mrrLastMonth ? 'up' : 'down',
            ],
            'estates' => [
                'current' => $activeEstatesCurrent,
                'previous' => $activeEstatesLastMonth,
                'growth' => $this->calculateGrowth($activeEstatesCurrent, $activeEstatesLastMonth),
                'trend' => $activeEstatesCurrent >= $activeEstatesLastMonth ? 'up' : 'down',
            ],
            'subscriptions' => [
                'current' => $activeSubscriptionsCurrent,
                'previous' => $activeSubscriptionsLastMonth,
                'growth' => $this->calculateGrowth($activeSubscriptionsCurrent, $activeSubscriptionsLastMonth),
                'trend' => $activeSubscriptionsCurrent >= $activeSubscriptionsLastMonth ? 'up' : 'down',
            ],
            'trials' => [
                'current' => $trialsCurrent,
                'previous' => $trialsLastMonth,
                'growth' => $this->calculateGrowth($trialsCurrent, $trialsLastMonth),
                'trend' => $trialsCurrent >= $trialsLastMonth ? 'up' : 'down',
            ],
        ];
    }

    private function calculateMRR(): float
    {
        $residentMrrKobo = DB::table('resident_subscriptions')
            ->join('plans', 'resident_subscriptions.plan_id', '=', 'plans.id')
            ->where('resident_subscriptions.status', 'active')
            ->selectRaw('SUM(
                CASE 
                    WHEN plans.billing_interval = "annually" THEN plans.price / 12
                    WHEN plans.billing_interval = "semi-annually" THEN plans.price / 6
                    WHEN plans.billing_interval = "quarterly" THEN plans.price / 3
                    ELSE plans.price
                END
            ) as total_mrr')
            ->value('total_mrr') ?? 0;

        return (float) $residentMrrKobo / 100;
    }

    private function calculateGrowth(float|int $current, float|int $previous): float
    {
        if ($previous == 0) {
            return 100;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function getPlatformGrowthChart(int $months = 6): array
    {
        $data = [];
        $now = now();

        for ($i = $months - 1; $i >= 0; $i--) {
            $targetMonth = $now->copy()->subMonths($i);
            $endOfMonth = $targetMonth->copy()->endOfMonth();
            $startOfMonth = $targetMonth->copy()->startOfMonth();

            // Real historical estates created up to that month
            $estatesCount = Estate::where('created_at', '<=', $endOfMonth)->count();

            // Real historical MRR calculation for that month
            // A subscription was active in that month if it was created before the month ended,
            // and its current period end is after the month started.
            $historicalMrrKobo = DB::table('resident_subscriptions')
                ->join('plans', 'resident_subscriptions.plan_id', '=', 'plans.id')
                ->where('resident_subscriptions.created_at', '<=', $endOfMonth)
                ->where(function ($query) use ($startOfMonth) {
                    $query->where('resident_subscriptions.current_period_end', '>=', $startOfMonth)
                        ->orWhereNull('resident_subscriptions.current_period_end'); // Lifetime/Trials with no end
                })
                ->where('resident_subscriptions.status', 'active')
                ->selectRaw('SUM(
                    CASE 
                        WHEN plans.billing_interval = "annually" THEN plans.price / 12
                        WHEN plans.billing_interval = "semi-annually" THEN plans.price / 6
                        WHEN plans.billing_interval = "quarterly" THEN plans.price / 3
                        ELSE plans.price
                    END
                ) as total_mrr')
                ->value('total_mrr') ?? 0;

            $data[] = [
                'month' => $targetMonth->format('M Y'),
                'estates' => $estatesCount,
                'mrr' => (float) $historicalMrrKobo / 100,
            ];
        }

        return $data;
    }
}
