<?php

namespace App\Observers;

use App\Models\PaymentTransaction;
use App\Services\Ledger\LedgerService;

class PaymentTransactionObserver
{
    public function __construct(
        private LedgerService $ledgerService,
    ) {}

    public function created(PaymentTransaction $paymentTransaction): void
    {
        $this->ledgerService->recordFromPaymentTransaction($paymentTransaction);
    }

    public function updated(PaymentTransaction $paymentTransaction): void
    {
        if ($paymentTransaction->wasChanged(['status', 'amount', 'verified_at', 'recorded_at'])) {
            $this->ledgerService->recordFromPaymentTransaction($paymentTransaction->fresh());
        }
    }
}
