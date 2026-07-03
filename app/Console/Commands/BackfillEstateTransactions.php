<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Services\Ledger\LedgerService;
use Illuminate\Console\Command;

class BackfillEstateTransactions extends Command
{
    protected $signature = 'ledger:backfill {--estate= : Estate ID to backfill}';

    protected $description = 'Backfill estate transactions from existing payment records';

    public function handle(LedgerService $ledgerService): int
    {
        $estateId = $this->option('estate');

        $paymentQuery = Payment::query()->when($estateId, fn ($q) => $q->where('estate_id', $estateId));
        $paymentCount = $paymentQuery->count();

        $this->info("Backfilling {$paymentCount} collection payments...");

        $paymentQuery->chunkById(200, function ($payments) use ($ledgerService) {
            foreach ($payments as $payment) {
                $ledgerService->recordFromPayment($payment);
            }
        });

        $transactionQuery = PaymentTransaction::query()->when($estateId, fn ($q) => $q->where('estate_id', $estateId));
        $transactionCount = $transactionQuery->count();

        $this->info("Backfilling {$transactionCount} subscription payments...");

        $transactionQuery->chunkById(200, function ($transactions) use ($ledgerService) {
            foreach ($transactions as $transaction) {
                $ledgerService->recordFromPaymentTransaction($transaction);
            }
        });

        $this->info('Backfill complete.');

        return self::SUCCESS;
    }
}
