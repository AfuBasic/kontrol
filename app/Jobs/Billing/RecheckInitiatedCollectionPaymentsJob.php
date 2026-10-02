<?php

namespace App\Jobs\Billing;

use App\Models\Payment;
use App\Services\Billing\CollectionPaymentSettler;
use App\Services\PaystackService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Collection payments are normally settled by Paystack's webhook or by the resident's status page.
 * If both are missed (webhook lost on a bad network, resident closed the page after paying), the
 * payment sits "initiated" forever even though the money arrived. This asks Paystack directly.
 *
 * It only ever acts on what Paystack itself says, and settles through the same locked, once-only
 * path as the webhook, so running alongside either of them is safe.
 */
class RecheckInitiatedCollectionPaymentsJob implements ShouldQueue
{
    use Queueable;

    /** Give the webhook and the resident's own return trip a chance first. */
    private const MIN_AGE_MINUTES = 15;

    /** Beyond this the payment is abandoned, not pending. */
    private const MAX_AGE_DAYS = 7;

    private const BATCH = 50;

    public int $tries = 1;

    public int $timeout = 600;

    public function handle(PaystackService $paystack, CollectionPaymentSettler $settler): void
    {
        $payments = Payment::withoutGlobalScopes()
            ->whereIn('status', ['initiated', 'pending'])
            ->where('reference', 'like', 'COLL-%')
            ->where('created_at', '<=', now()->subMinutes(self::MIN_AGE_MINUTES))
            ->where('created_at', '>=', now()->subDays(self::MAX_AGE_DAYS))
            ->oldest()
            ->limit(self::BATCH)
            ->get();

        foreach ($payments as $payment) {
            // One payment's trouble (a timeout, a bad response) must never stop the others.
            try {
                $this->recheck($payment, $paystack, $settler);
            } catch (\Throwable $e) {
                Log::warning("Recheck of collection payment {$payment->reference} failed: ".$e->getMessage());
            }
        }
    }

    private function recheck(Payment $payment, PaystackService $paystack, CollectionPaymentSettler $settler): void
    {
        $verification = $paystack->verifyPayment($payment->reference);
        $status = $verification['status'] ?? null;

        if ($status === 'success') {
            // Same rule as the webhook and the status page: collections are paid by bank transfer only.
            if (($verification['channel'] ?? 'bank_transfer') !== 'bank_transfer') {
                Log::error("Security violation: Collection payment attempted with restricted channel. Ref={$payment->reference}");
                $payment->update(['status' => 'failed']);

                return;
            }

            $settler->settle($payment->reference, isset($verification['amount']) ? (int) $verification['amount'] : null);

            return;
        }

        if (in_array($status, ['failed', 'abandoned', 'reversed'], true)) {
            $payment->update(['status' => 'failed']);
        }

        // Anything else ('ongoing', 'pending', 'processing') is still in flight: look again next time.
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
