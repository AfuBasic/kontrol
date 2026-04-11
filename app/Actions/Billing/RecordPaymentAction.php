<?php

namespace App\Actions\Billing;

use App\Events\Billing\PaymentReceived;
use App\Models\Invoice;
use App\Services\Billing\PaymentVerificationService;

class RecordPaymentAction
{
    public function __construct(
        private PaymentVerificationService $verificationService,
    ) {}

    /**
     * Record a payment against an invoice.
     * Uses comprehensive verification, idempotency, and atomic transactions.
     * Prevents double-payments, handles retries, and tracks all payment attempts.
     *
     * @param  string  $paystackReference  Unique reference from Paystack
     * @param  string|null  $idempotencyKey  Optional idempotency key for deduplication
     *
     * @throws \Exception on critical payment errors
     */
    public function execute(Invoice $invoice, string $paystackReference, ?string $idempotencyKey = null): Invoice
    {
        // Verify payment with all safety checks (idempotency, amount validation, locking, etc.)
        $transaction = $this->verificationService->verifyAndRecordPayment(
            $paystackReference,
            $invoice,
            $idempotencyKey
        );

        // Reload invoice to get updated state
        $invoice->refresh();

        // Only dispatch notification if this is the first successful recording
        // (prevents duplicate notifications from webhook retries)
        if ($transaction->isRecorded() && $transaction->attempt_count === 1) {
            PaymentReceived::dispatch($invoice);
        }

        return $invoice;
    }
}
