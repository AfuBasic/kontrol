<?php

namespace App\Services\Zeus;

use App\Models\Invoice;
use App\Models\PaymentTransaction;

class MoneyFlowService
{
    /**
     * Calculates average time-to-pay for invoices and platform-wide failed payment rates.
     */
    public function getCollectionEconomics(): array
    {
        // Failed Payment Rate
        $totalTransactions = PaymentTransaction::count();
        $failedTransactions = PaymentTransaction::where('status', 'failed')->count();

        $failedRate = $totalTransactions > 0
            ? round(($failedTransactions / $totalTransactions) * 100, 1)
            : 0;

        // Average Days to Pay (only looking at paid invoices with a valid paid_at date)
        // We use PHP to avoid cross-database (SQLite vs MySQL) DATEDIFF syntax issues for now.
        $paidInvoices = Invoice::where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereNotNull('created_at')
            ->get(['created_at', 'paid_at']);

        $totalDays = 0;
        foreach ($paidInvoices as $invoice) {
            $totalDays += $invoice->created_at->diffInDays($invoice->paid_at);
        }

        $avgDaysToPay = $paidInvoices->count() > 0
            ? round($totalDays / $paidInvoices->count(), 1)
            : 0;

        return [
            'failed_payment_rate' => $failedRate,
            'avg_days_to_pay' => $avgDaysToPay,
        ];
    }

    /**
     * Replaces the Gross/Fees waterfall with a Collection Funnel (Total Invoiced -> Collected -> Outstanding).
     */
    public function getSettlementAnalytics(): array
    {
        $totalInvoicedKobo = Invoice::sum('amount');
        $collectedKobo = Invoice::where('status', 'paid')->sum('amount');
        $outstandingKobo = Invoice::whereIn('status', ['pending', 'overdue'])->sum('amount');

        return [
            [
                'name' => 'Total Invoiced',
                'value' => (float) $totalInvoicedKobo / 100,
                'fill' => '#6366f1', // Indigo
            ],
            [
                'name' => 'Successfully Collected',
                'value' => (float) $collectedKobo / 100,
                'fill' => '#10b981', // Emerald
            ],
            [
                'name' => 'Outstanding Balance',
                'value' => (float) $outstandingKobo / 100,
                'fill' => '#f59e0b', // Amber
            ],
        ];
    }

    /**
     * Groups all pending and overdue invoices into aging buckets (0-30, 31-60, 61-90, 90+ days past due).
     */
    public function getOutstandingAging(): array
    {
        $overdueInvoices = Invoice::whereIn('status', ['pending', 'overdue'])
            ->whereNotNull('due_date')
            ->get(['amount', 'due_date']);

        $buckets = [
            '0_30' => 0,
            '31_60' => 0,
            '61_90' => 0,
            '90_plus' => 0,
        ];

        $now = now()->startOfDay();

        foreach ($overdueInvoices as $invoice) {
            // Only bucket if it is actually past due (or due today)
            if ($invoice->due_date->startOfDay() <= $now) {
                $daysPastDue = $invoice->due_date->startOfDay()->diffInDays($now);
                $amountNaira = (float) $invoice->amount / 100;

                if ($daysPastDue <= 30) {
                    $buckets['0_30'] += $amountNaira;
                } elseif ($daysPastDue <= 60) {
                    $buckets['31_60'] += $amountNaira;
                } elseif ($daysPastDue <= 90) {
                    $buckets['61_90'] += $amountNaira;
                } else {
                    $buckets['90_plus'] += $amountNaira;
                }
            }
        }

        return [
            [
                'bucket' => '0-30 Days',
                'amount' => $buckets['0_30'],
            ],
            [
                'bucket' => '31-60 Days',
                'amount' => $buckets['31_60'],
            ],
            [
                'bucket' => '61-90 Days',
                'amount' => $buckets['61_90'],
            ],
            [
                'bucket' => '90+ Days',
                'amount' => $buckets['90_plus'],
            ],
        ];
    }
}
