<?php

namespace App\Jobs\Billing;

use App\Models\Invoice;
use App\Models\ResidentSubscription;
use App\Notifications\Resident\PaymentFailedNotification;
use App\Services\Billing\BillingFinalizationService;
use App\Services\PaystackService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

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

            // 2. Generate an idempotent reference for this specific attempt
            $attempts = ($invoice->metadata['attempts'] ?? 0) + 1;
            $autoReference = $invoice->invoice_number.'-AUTO-'.now()->format('Y-m-d').'-'.$attempts;

            Log::info("Attempting auto-charge for invoice #{$invoice->id} (Attempt #{$attempts})", [
                'amount' => $invoice->amount,
                'email' => $email,
                'reference' => $autoReference,
            ]);

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
            $errorMessage = $e->getMessage();

            // SPECIAL CASE: If we get a duplicate reference error, it might mean a previous
            // attempt actually succeeded but we didn't record it. Let's verify.
            if (str_contains(strtolower($errorMessage), 'duplicate')) {
                Log::warning("Duplicate reference detected for invoice #{$invoice->id}. Verifying status...");
                try {
                    $verifyResult = $paystackService->verifyPayment($autoReference);
                    if ($verifyResult['status'] === 'success') {
                        $finalizationService->finalizeSuccess($invoice, [
                            'reference' => $verifyResult['reference'],
                            'payment_method' => 'card',
                            'customer_email' => $email,
                        ]);

                        return;
                    }
                } catch (\Exception $ve) {
                    Log::error('Verification failed for duplicate reference: '.$ve->getMessage());
                }
            }

            Log::error("Auto-charge exception for invoice #{$invoice->id}: ".$errorMessage);

            // If it's an API error that we shouldn't retry (invalid keys, duplicate reference, etc.)
            // we handle it as a failure attempt so the user is notified.
            $terminalErrorPatterns = ['invalid', '400', 'duplicate', 'reference', 'bad request', 'not found'];
            $isTerminal = false;

            foreach ($terminalErrorPatterns as $pattern) {
                if (str_contains(strtolower($errorMessage), $pattern)) {
                    $isTerminal = true;
                    break;
                }
            }

            if ($isTerminal) {
                // Sanitize: If the error contains JSON, extract just the 'message' for the user
                $cleanMessage = $errorMessage;
                if (str_contains($errorMessage, '{')) {
                    $jsonPart = substr($errorMessage, strpos($errorMessage, '{'));
                    $decoded = json_decode($jsonPart, true);
                    if (isset($decoded['message'])) {
                        $cleanMessage = "Payment gateway error: " . $decoded['message'];
                    }
                }

                $this->handleFailure($invoice, $cleanMessage);
            } else {
                // Otherwise, re-throw to allow standard job retries (e.g. for timeouts/network issues)
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
            $invoice->user->notify(new PaymentFailedNotification(
                $invoice,
                $reason,
                $metadata['attempts'] ?? 1,
                3 // max attempts
            ));
        }
    }
}
