<?php

namespace App\Jobs\Billing;

use App\Actions\Billing\RecordPaymentAction;
use App\Models\PaymentTransaction;
use App\Services\PaystackService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * The invoice twin of RecheckInitiatedCollectionPaymentsJob, for resident and estate subscription payments.
 *
 * An invoice payment is normally recorded when the resident returns from Paystack or when the webhook
 * arrives. If both are lost (a bad connection, a closed browser), the payment stays "pending" even though
 * the money may have arrived. This asks Paystack directly.
 *
 * Paystack is asked first, and only a confirmed payment is handed to RecordPaymentAction, which already
 * checks the exact amount, locks the invoice and refuses to record the same payment twice.
 */
class RecheckPendingInvoicePaymentsJob implements ShouldQueue
{
    use Queueable;

    /** Give the webhook and the resident's own return trip a chance first. */
    private const MIN_AGE_MINUTES = 15;

    /** Beyond this the attempt is abandoned, not pending. */
    private const MAX_AGE_DAYS = 7;

    private const BATCH = 50;

    public int $tries = 1;

    public int $timeout = 600;

    public function handle(PaystackService $paystack, RecordPaymentAction $recordPayment): void
    {
        $transactions = PaymentTransaction::withoutGlobalScopes()
            ->where('status', 'pending')
            ->whereNotNull('invoice_id')
            ->where('created_at', '<=', now()->subMinutes(self::MIN_AGE_MINUTES))
            ->where('created_at', '>=', now()->subDays(self::MAX_AGE_DAYS))
            ->with('invoice')
            ->oldest()
            ->limit(self::BATCH)
            ->get();

        foreach ($transactions as $transaction) {
            // One payment's trouble must never stop the others.
            try {
                $this->recheck($transaction, $paystack, $recordPayment);
            } catch (\Throwable $e) {
                Log::warning("Recheck of invoice payment {$transaction->paystack_reference} failed: ".$e->getMessage());
            }
        }
    }

    private function recheck(PaymentTransaction $transaction, PaystackService $paystack, RecordPaymentAction $recordPayment): void
    {
        $invoice = $transaction->invoice;

        // Card setups are not invoice payments, and a paid invoice has nothing left to settle.
        if (! $invoice || ($transaction->metadata['type'] ?? null) === 'card_setup' || $invoice->isPaid()) {
            return;
        }

        $status = $paystack->verifyPayment($transaction->paystack_reference)['status'] ?? null;

        if ($status === 'success') {
            $recordPayment->execute($invoice, $transaction->paystack_reference);

            return;
        }

        if (in_array($status, ['failed', 'abandoned', 'reversed'], true)) {
            $transaction->update([
                'status' => 'failed',
                'error_code' => 'PAYSTACK_'.strtoupper($status),
                'error_message' => "Paystack reports this payment as {$status}.",
                'last_checked_at' => now(),
            ]);

            return;
        }

        // Still in flight ('ongoing', 'pending', 'processing'): note that we looked, and look again next time.
        $transaction->update(['last_checked_at' => now()]);
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
