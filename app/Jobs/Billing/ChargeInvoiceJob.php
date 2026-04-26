<?php

namespace App\Jobs\Billing;

use App\Mail\Resident\PaymentFailedMail;
use App\Models\Invoice;
use App\Models\ResidentSubscription;
use App\Services\Billing\BillingFinalizationService;
use App\Services\PaystackService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ChargeInvoiceJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public $backoff = [60, 300, 900]; // 1m, 5m, 15m

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $invoiceId
    ) {
        $this->onQueue('payments');
    }

    /**
     * Execute the job.
     */
    public function handle(PaystackService $paystackService, BillingFinalizationService $finalizationService): void
    {
        $invoice = Invoice::with(['estate', 'user'])->find($this->invoiceId);

        if (! $invoice || $invoice->status === 'paid') {
            return;
        }

        // 1. Determine Authorization Code
        $authCode = $this->getAuthorizationCode($invoice);

        if (! $authCode) {
            Log::warning("No authorization code found for invoice #{$invoice->id}. Skipping auto-billing.");

            return;
        }

        // 2. Attempt Charge
        try {
            $email = $invoice->user->email ?? $invoice->estate->email ?? $invoice->estate->users()->first()?->email;

            Log::info("Attempting auto-charge for invoice #{$invoice->id}", [
                'amount' => $invoice->amount,
                'email' => $email,
            ]);

            // Generate an idempotent reference for this specific invoice and date
            // This ensures that retries within the same day use the SAME reference,
            // allowing Paystack to prevent double-charging.
            $autoReference = $invoice->invoice_number.'-AUTO-'.now()->format('Y-m-d');

            $result = $paystackService->chargeAuthorization(
                $authCode,
                $email,
                $invoice->amount,
                $autoReference,
                ['invoice_id' => $invoice->id]
            );

            if ($result['status'] === 'success') {
                $finalizationService->finalizeSuccess($invoice, [
                    'reference' => $result['reference'],
                    'payment_method' => 'card',
                    'customer_email' => $email,
                ]);

                Log::info("Auto-charge successful for invoice #{$invoice->id}");
            } else {
                $this->handleFailure($invoice, $result['gateway_response'] ?? 'Payment failed');
            }

        } catch (\Exception $e) {
            Log::error("Auto-charge exception for invoice #{$invoice->id}: ".$e->getMessage());

            // Re-throw to trigger job retry logic if it's a network/API issue
            // But if it's a 400 error from Paystack (e.g. invalid auth), we should catch it.
            if (str_contains($e->getMessage(), '400') || str_contains($e->getMessage(), 'invalid')) {
                $this->handleFailure($invoice, $e->getMessage());
            } else {
                throw $e;
            }
        }
    }

    private function getAuthorizationCode(Invoice $invoice): ?string
    {
        if ($invoice->user_id) {
            $sub = ResidentSubscription::where('user_id', $invoice->user_id)
                ->where('estate_id', $invoice->estate_id)
                ->first();

            return $sub?->paystack_authorization_code;
        }

        $estateSub = $invoice->estate->subscriptionRecord;

        return $estateSub?->paystack_authorization_code;
    }

    private function handleFailure(Invoice $invoice, string $reason): void
    {
        Log::error("Auto-charge failed for invoice #{$invoice->id}: {$reason}");

        // Increment attempt count in metadata
        $metadata = $invoice->metadata ?? [];
        $metadata['attempts'] = ($metadata['attempts'] ?? 0) + 1;
        $metadata['last_failure_reason'] = $reason;
        $metadata['last_attempt_at'] = now()->toDateTimeString();

        $invoice->update(['metadata' => $metadata]);

        // If it's a resident invoice, we might want to mark them as past_due if it fails repeatedly
        if ($invoice->user_id && ($metadata['attempts'] >= 3)) {
            $sub = ResidentSubscription::where('user_id', $invoice->user_id)
                ->where('estate_id', $invoice->estate_id)
                ->first();

            if ($sub) {
                $sub->update(['status' => 'past_due']);
            }
        }

        // Notify user of the failure
        if ($invoice->user_id && $invoice->user) {
            Mail::to($invoice->user->email)->send(new PaymentFailedMail(
                $invoice,
                $reason,
                $metadata['attempts'] ?? 1,
                3 // max attempts
            ));
        }
    }
}
