<?php

namespace App\Services\Zeus;

use App\Models\PaymentTransaction;

class MoneyFlowService
{
    /**
     * Calculates checkout friction metrics from all payment transactions.
     */
    public function getCheckoutFriction(): array
    {
        $totalTransactions = PaymentTransaction::count();
        $failedTransactions = PaymentTransaction::where('status', 'failed')->count();

        $failedRate = $totalTransactions > 0
            ? round(($failedTransactions / $totalTransactions) * 100, 1)
            : 0;

        $successfulTransactions = PaymentTransaction::where('status', 'success');
        $avgSizeKobo = $successfulTransactions->count() > 0
            ? $successfulTransactions->avg('amount')
            : 0;

        return [
            'failed_payment_rate' => $failedRate,
            'avg_transaction_size' => (float) $avgSizeKobo / 100,
        ];
    }

    /**
     * Retrieves the daily sum of successful transactions over the last 30 days.
     */
    public function getDailyCashVelocity(): array
    {
        $startDate = now()->subDays(29)->startOfDay();
        $endDate = now()->endOfDay();

        // Cross-database compatible grouping (MySQL DATE() vs SQLite)
        // Since we may be on SQLite locally and MySQL in prod, pulling it locally for a 30 day window is fast enough.
        $transactions = PaymentTransaction::where('status', 'success')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get(['amount', 'created_at']);

        // Initialize all 30 days with 0
        $dailyData = [];
        for ($i = 0; $i < 30; $i++) {
            $dateString = $startDate->copy()->addDays($i)->format('Y-m-d');
            $dailyData[$dateString] = [
                'date' => $startDate->copy()->addDays($i)->format('M j'),
                'amount' => 0,
            ];
        }

        // Sum the transactions into the correct day
        foreach ($transactions as $txn) {
            $dateString = $txn->created_at->format('Y-m-d');
            if (isset($dailyData[$dateString])) {
                $dailyData[$dateString]['amount'] += ((float) $txn->amount / 100);
            }
        }

        return array_values($dailyData);
    }

    /**
     * Retrieves the 5 most recent failed transactions to investigate gateway issues.
     */
    public function getRecentFailures(): array
    {
        return PaymentTransaction::where('payment_transactions.status', 'failed')
            ->join('estates', 'payment_transactions.estate_id', '=', 'estates.id')
            ->select('payment_transactions.id', 'payment_transactions.amount', 'payment_transactions.created_at', 'estates.name as estate_name', 'estates.id as estate_id')
            ->orderByDesc('payment_transactions.created_at')
            ->limit(5)
            ->get()
            ->map(function ($txn) {
                return [
                    'id' => $txn->id,
                    'estate_id' => $txn->estate_id,
                    'estate_name' => $txn->estate_name,
                    'amount' => (float) $txn->amount / 100,
                    'date' => $txn->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }
}
