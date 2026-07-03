<?php

namespace App\Observers;

use App\Models\Payment;
use App\Services\Ledger\LedgerService;

class PaymentObserver
{
    public function __construct(
        private LedgerService $ledgerService,
    ) {}

    public function created(Payment $payment): void
    {
        $this->ledgerService->recordFromPayment($payment);
    }

    public function updated(Payment $payment): void
    {
        if ($payment->wasChanged(['status', 'amount', 'paid_at'])) {
            $this->ledgerService->recordFromPayment($payment->fresh());
        }
    }
}
