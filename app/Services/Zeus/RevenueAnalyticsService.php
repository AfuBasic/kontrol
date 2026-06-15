<?php

namespace App\Services\Zeus;

use App\Models\PaymentTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RevenueAnalyticsService
{
    /**
     * Get 12 months of historical MRR and 3 months of forecasted MRR using a 3-month moving average.
     */
    public function getRevenueForecastData(): array
    {
        $data = [];
        $now = now()->startOfMonth();

        $historicalData = [];

        // 1. Calculate the last 12 months of historical MRR
        for ($i = 11; $i >= 0; $i--) {
            $targetMonth = $now->copy()->subMonths($i);
            $endOfMonth = $targetMonth->copy()->endOfMonth();
            $startOfMonth = $targetMonth->copy()->startOfMonth();

            $historicalMrrKobo = DB::table('resident_subscriptions')
                ->join('plans', 'resident_subscriptions.plan_id', '=', 'plans.id')
                ->where('resident_subscriptions.created_at', '<=', $endOfMonth)
                ->where(function ($query) use ($startOfMonth) {
                    $query->where('resident_subscriptions.current_period_end', '>=', $startOfMonth)
                        ->orWhereNull('resident_subscriptions.current_period_end');
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

            $historicalData[] = [
                'date' => $targetMonth,
                'month' => $targetMonth->format('M Y'),
                'actual' => (float) $historicalMrrKobo / 100,
                'projected' => null, // Actual historical point
            ];
        }

        // Add historical data to the final array
        $data = $historicalData;

        // 2. Forecast the next 3 months using a Simple Moving Average (SMA) of the last 3 data points
        $lastThreeMonths = array_slice($historicalData, -3);
        $movingAverageData = array_map(fn ($item) => $item['actual'], $lastThreeMonths);

        // Connect the projection line seamlessly by duplicating the last actual point as a projected point
        if (! empty($historicalData)) {
            $lastActual = end($historicalData);
            // Replace the last actual point to ALSO be the start of the projected line for continuous charting
            $data[count($data) - 1]['projected'] = $lastActual['actual'];
        }

        for ($i = 1; $i <= 3; $i++) {
            $targetMonth = $now->copy()->addMonths($i);

            // Calculate average of the last 3 values (can be actuals or previous projections)
            $average = count($movingAverageData) > 0 ? array_sum($movingAverageData) / count($movingAverageData) : 0;

            $data[] = [
                'date' => $targetMonth,
                'month' => $targetMonth->format('M Y'),
                'actual' => null, // This is a future point
                'projected' => round($average, 2),
            ];

            // Shift the moving average window forward
            array_shift($movingAverageData);
            $movingAverageData[] = $average;
        }

        // Clean up the Carbon date objects for serialization
        return array_map(function ($item) {
            unset($item['date']);

            return $item;
        }, $data);
    }

    /**
     * Group active resident subscription MRR strictly by Plan.
     */
    public function getRevenueBreakdown(): array
    {
        $breakdown = DB::table('resident_subscriptions')
            ->join('plans', 'resident_subscriptions.plan_id', '=', 'plans.id')
            ->where('resident_subscriptions.status', 'active')
            ->selectRaw('plans.name as plan_name, SUM(
                CASE 
                    WHEN plans.billing_interval = "annually" THEN plans.price / 12
                    WHEN plans.billing_interval = "semi-annually" THEN plans.price / 6
                    WHEN plans.billing_interval = "quarterly" THEN plans.price / 3
                    ELSE plans.price
                END
            ) as total_mrr')
            ->groupBy('plans.id', 'plans.name')
            ->orderByDesc('total_mrr')
            ->get();

        $formatted = [];
        $colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // Violet, Blue, Emerald, Amber, Red

        foreach ($breakdown as $index => $row) {
            if ($row->total_mrr > 0) {
                $formatted[] = [
                    'name' => $row->plan_name,
                    'value' => (float) $row->total_mrr / 100,
                    'color' => $colors[$index % count($colors)],
                ];
            }
        }

        return $formatted;
    }

    /**
     * Get the top 5 highest-paying estates based on lifetime successful payment transactions.
     */
    public function getTopPerformers(): array
    {
        return PaymentTransaction::where('payment_transactions.status', 'success')
            ->join('estates', 'payment_transactions.estate_id', '=', 'estates.id')
            ->selectRaw('estates.id, estates.name, SUM(payment_transactions.amount) as total_revenue')
            ->groupBy('estates.id', 'estates.name')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function ($estate) {
                return [
                    'id' => $estate->id,
                    'name' => $estate->name,
                    'total_revenue' => (float) $estate->total_revenue / 100,
                ];
            })
            ->toArray();
    }
}
