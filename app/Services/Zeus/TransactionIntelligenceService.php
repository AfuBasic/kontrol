<?php

namespace App\Services\Zeus;

use App\Models\PaymentTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TransactionIntelligenceService
{
    /**
     * Get high-level transaction metrics.
     */
    public function getMetrics(): array
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();

        $successVolume = PaymentTransaction::where('status', 'success')->sum('amount');
        $monthlyVolume = PaymentTransaction::where('status', 'success')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('amount');

        $totalTransactions = PaymentTransaction::count();
        $successTransactions = PaymentTransaction::where('status', 'success')->count();
        $failedVolume = PaymentTransaction::where('status', 'failed')->sum('amount');

        $successRate = $totalTransactions > 0
            ? round(($successTransactions / $totalTransactions) * 100, 1)
            : 0;

        $averageTransactionValue = $successTransactions > 0
            ? round($successVolume / $successTransactions)
            : 0;

        return [
            'total_volume' => $successVolume,
            'monthly_volume' => $monthlyVolume,
            'failed_volume' => $failedVolume,
            'success_rate' => $successRate,
            'average_value' => $averageTransactionValue,
        ];
    }

    /**
     * Get 30-day transaction volume trend for charts.
     */
    public function getVolumeTrend(int $days = 30): array
    {
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();

        // Query daily success volumes
        $dailyData = PaymentTransaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(amount) as volume')
        )
            ->where('status', 'success')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $trend = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i)->format('Y-m-d');
            $trend[] = [
                'date' => Carbon::parse($date)->format('M d'),
                'volume' => isset($dailyData[$date]) ? (int) $dailyData[$date]->volume : 0,
            ];
        }

        return $trend;
    }
}
