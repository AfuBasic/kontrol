<?php

namespace App\Services\Zeus;

use App\Models\Estate;
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

    /**
     * Compute Financial KPIs: ARR, ARPE, ARPU, Revenue At Risk, and Monthly Churn.
     */
    public function getFinancialKPIs(): array
    {
        // 1. Calculate Total MRR
        $mrr = $this->calculateMRR();
        $arr = $mrr * 12;

        // 2. Active Estates count
        $activeEstatesCount = Estate::count();
        $arpe = $activeEstatesCount > 0 ? $mrr / $activeEstatesCount : 0;

        // 3. Active Paying Residents count
        $activeResidentsCount = DB::table('resident_subscriptions')->where('status', 'active')->count();
        $arpu = $activeResidentsCount > 0 ? $mrr / $activeResidentsCount : 0;

        // 4. Revenue at Risk (Failed transactions amount over last 30 days)
        $failedTransactionsKobo = PaymentTransaction::where('status', 'failed')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('amount');
        $revenueAtRisk = (float) $failedTransactionsKobo / 100;

        // 5. Monthly Churn Rate Calculation
        // A simple churn definition: lost MRR / total MRR at start of month
        // We'll estimate this by looking at subscriptions that were canceled or expired in the last 30 days
        $lostMrrKobo = DB::table('resident_subscriptions')
            ->join('plans', 'resident_subscriptions.plan_id', '=', 'plans.id')
            ->whereIn('resident_subscriptions.status', ['canceled', 'past_due', 'unpaid'])
            ->where('resident_subscriptions.updated_at', '>=', now()->subDays(30))
            ->selectRaw('SUM(
                CASE 
                    WHEN plans.billing_interval = "annually" THEN plans.price / 12
                    WHEN plans.billing_interval = "semi-annually" THEN plans.price / 6
                    WHEN plans.billing_interval = "quarterly" THEN plans.price / 3
                    ELSE plans.price
                END
            ) as total_lost')
            ->value('total_lost') ?? 0;

        $lostMrr = (float) $lostMrrKobo / 100;

        $churnRate = 0;
        if ($mrr + $lostMrr > 0) {
            $churnRate = ($lostMrr / ($mrr + $lostMrr)) * 100;
        }

        return [
            'arr' => $arr,
            'arpe' => $arpe,
            'arpu' => $arpu,
            'revenue_at_risk' => $revenueAtRisk,
            'churn_rate' => round($churnRate, 2),
        ];
    }

    /**
     * Get recent high-value successful transactions.
     * Threshold: > N50,000 (5,000,000 kobo).
     */
    public function getRecentHighValueTransactions(int $limit = 5): array
    {
        return PaymentTransaction::with('estate:id,name')
            ->where('status', 'success')
            ->where('amount', '>=', 5000000) // 50,000 NGN
            ->latest()
            ->limit($limit)
            ->get(['id', 'estate_id', 'amount', 'created_at', 'paystack_reference', 'payment_method'])
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'estate_name' => $transaction->estate->name ?? 'Unknown',
                    'amount' => (float) $transaction->amount / 100,
                    'reference' => $transaction->paystack_reference,
                    'method' => $transaction->payment_method,
                    'date' => $transaction->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }

    /**
     * Get recent failed payments across the platform.
     */
    public function getRecentFailedPayments(int $limit = 5): array
    {
        return PaymentTransaction::with('estate:id,name')
            ->where('status', 'failed')
            ->latest()
            ->limit($limit)
            ->get(['id', 'estate_id', 'amount', 'created_at', 'error_message', 'customer_email'])
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'estate_name' => $transaction->estate->name ?? 'Unknown',
                    'customer_email' => $transaction->customer_email,
                    'amount' => (float) $transaction->amount / 100,
                    'error' => $transaction->error_message ?? 'Transaction Failed',
                    'date' => $transaction->created_at->diffForHumans(),
                ];
            })
            ->toArray();
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
}
