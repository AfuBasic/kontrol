<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\ResidentSubscription;
use App\Services\BillingCycleService;
use App\Services\PaystackService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentVerificationService
{
    public const MAX_RETRY_ATTEMPTS = 3;

    public const RETRY_DELAY_SECONDS = 5;

    public function __construct(
        private PaystackService $paystackService,
        private BillingCycleService $billingCycleService,
    ) {}

    /**
     * Verify and record a payment atomically.
     * Handles idempotency, double-payment prevention, and comprehensive error tracking.
     *
     * @throws Exception on critical errors
     */
    public function verifyAndRecordPayment(
        string $paystackReference,
        Invoice $invoice,
        ?string $idempotencyKey = null
    ): PaymentTransaction {
        // Generate idempotency key if not provided
        $idempotencyKey = $idempotencyKey ?? $this->generateIdempotencyKey($paystackReference);

        return DB::transaction(function () use ($paystackReference, $invoice, $idempotencyKey) {
            // 1. CHECK IDEMPOTENCY - Has this exact payment already been processed?
            $existingTransaction = $this->findExistingTransaction($paystackReference, $idempotencyKey);
            if ($existingTransaction) {
                // Idempotent - return the existing record instead of processing again
                if ($existingTransaction->isRecorded()) {
                    return $existingTransaction;
                }
            }

            // 2. LOCK THE INVOICE - Prevent concurrent modifications during payment recording
            $invoice = Invoice::lockForUpdate()->find($invoice->id);

            // 3. CHECK INVOICE ALREADY PAID - Prevent double-payment if someone tries again
            if ($invoice->isPaid()) {
                throw new Exception(
                    "Invoice {$invoice->invoice_number} already paid. Payment duplicate attempt detected.",
                    'INVOICE_ALREADY_PAID'
                );
            }

            // 4. VERIFY PAYMENT WITH PAYSTACK - Get definitive payment status from source
            $verification = $this->verifyPaymentWithRetry($paystackReference);

            if ($existingTransaction) {
                $existingTransaction->update(['last_checked_at' => now()]);
            }

            // 5. VALIDATE PAYMENT AMOUNT - Critical: Ensure amount matches exactly
            $this->validatePaymentAmount($verification, $invoice);

            // 6. VALIDATE PAYMENT STATUS - Must be successful
            if ($verification['status'] !== 'success') {
                return $this->recordFailedPayment(
                    $paystackReference,
                    $invoice,
                    $idempotencyKey,
                    'PAYMENT_NOT_SUCCESSFUL',
                    'Paystack returned status: '.$verification['status']
                );
            }

            // 7. RECORD TRANSACTION - Create or update record of payment attempt
            // If transaction already exists, update it instead of creating duplicate
            if ($existingTransaction) {
                $transaction = $existingTransaction;
                $transaction->update([
                    'status' => 'success',
                    'payment_method' => $verification['payment_method'] ?? $transaction->payment_method,
                    'customer_email' => $verification['customer_email'] ?? $transaction->customer_email,
                    'verified_at' => now(),
                    'last_checked_at' => now(),
                    'metadata' => [
                        'authorization' => $verification['authorization'] ?? null,
                        'customer' => $verification['customer'] ?? null,
                    ],
                ]);
            } else {
                $transaction = PaymentTransaction::create([
                    'invoice_id' => $invoice->id,
                    'estate_id' => $invoice->estate_id,
                    'paystack_reference' => $paystackReference,
                    'idempotency_key' => $idempotencyKey,
                    'amount' => $invoice->amount,
                    'currency' => 'NGN',
                    'status' => 'success',
                    'payment_method' => $verification['payment_method'] ?? null,
                    'customer_email' => $verification['customer_email'] ?? null,
                    'verified_at' => now(),
                    'last_checked_at' => now(),
                    'metadata' => [
                        'authorization' => $verification['authorization'] ?? null,
                        'customer' => $verification['customer'] ?? null,
                    ],
                ]);
            }

            // 8. FINALIZE PAYMENT - Centralized logic for all payment types
            $finalizationService = app(BillingFinalizationService::class);
            $finalizationService->finalizeSuccess($invoice, [
                'reference' => $paystackReference,
                'payment_method' => $verification['channel'] ?? 'card',
                'customer_email' => $verification['customer']['email'] ?? null,
            ]);

            // 8.1 Card authorization persistence is disabled; billing is handled by explicit payments.

            // 9. RECORD TRANSACTION AS PROCESSED - Prevent reprocessing
            $transaction->update([
                'recorded_at' => now(),
            ]);

            // 10. LOG PAYMENT SUCCESS
            activity()
                ->on($invoice->estate)
                ->withProperties([
                    'invoice_id' => $invoice->id,
                    'transaction_id' => $transaction->id,
                    'amount' => $invoice->amount,
                    'reference' => $paystackReference,
                ])
                ->log('Payment recorded successfully');

            return $transaction;
        });
    }

    /**
     * Find existing payment transaction for idempotency.
     */
    private function findExistingTransaction(string $paystackReference, string $idempotencyKey): ?PaymentTransaction
    {
        return PaymentTransaction::where('paystack_reference', $paystackReference)
            ->orWhere('idempotency_key', $idempotencyKey)
            ->first();
    }

    /**
     * Verify payment with Paystack, with retry logic for transient failures.
     *
     * @throws Exception on persistent failures
     */
    private function verifyPaymentWithRetry(string $paystackReference, int $attempt = 1): array
    {
        try {
            return $this->paystackService->verifyPayment($paystackReference);
        } catch (Exception $e) {
            if ($attempt < self::MAX_RETRY_ATTEMPTS) {
                sleep(self::RETRY_DELAY_SECONDS);

                return $this->verifyPaymentWithRetry($paystackReference, $attempt + 1);
            }

            throw new Exception(
                "Failed to verify payment after {$attempt} attempts: ".$e->getMessage(),
                'VERIFICATION_FAILED'
            );
        }
    }

    /**
     * Validate that the payment amount matches the invoice exactly.
     * Protects against fraud and incorrect amounts.
     *
     * @throws Exception if amount mismatch
     */
    private function validatePaymentAmount(array $verification, Invoice $invoice): void
    {
        $paystackAmount = $verification['amount'] ?? 0;

        // Amount must match exactly (in kobo)
        if ($paystackAmount !== $invoice->amount) {
            throw new Exception(
                "Amount mismatch: Expected {$invoice->amount} kobo, got {$paystackAmount} kobo. "
                .'Possible fraud or configuration error.',
                'AMOUNT_MISMATCH'
            );
        }
    }

    /**
     * Record a failed payment attempt.
     */
    private function recordFailedPayment(
        string $paystackReference,
        Invoice $invoice,
        string $idempotencyKey,
        string $errorCode,
        string $errorMessage
    ): PaymentTransaction {
        $existingTransaction = PaymentTransaction::where('paystack_reference', $paystackReference)->first();

        if ($existingTransaction) {
            $existingTransaction->increment('attempt_count');
            $existingTransaction->update([
                'status' => 'failed',
                'error_code' => $errorCode,
                'error_message' => $errorMessage,
                'last_checked_at' => now(),
            ]);

            return $existingTransaction;
        }

        $transaction = PaymentTransaction::create([
            'invoice_id' => $invoice->id,
            'estate_id' => $invoice->estate_id,
            'paystack_reference' => $paystackReference,
            'idempotency_key' => $idempotencyKey,
            'amount' => $invoice->amount,
            'currency' => 'NGN',
            'status' => 'failed',
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'attempt_count' => 1,
            'last_checked_at' => now(),
        ]);

        activity()
            ->on($invoice->estate)
            ->withProperties([
                'invoice_id' => $invoice->id,
                'transaction_id' => $transaction->id,
                'error_code' => $errorCode,
                'reference' => $paystackReference,
            ])
            ->log('Payment verification failed');

        return $transaction;
    }

    /**
     * Generate a cryptographically secure idempotency key.
     */
    private function generateIdempotencyKey(string $paystackReference): string
    {
        return hash('sha256', $paystackReference.Str::random(32).now()->timestamp);
    }

    /**
     * Verify and record a card setup payment, then process a refund.
     */
    public function verifyAndRecordCardSetup(string $paystackReference): PaymentTransaction
    {
        return DB::transaction(function () use ($paystackReference) {
            // 1. Find transaction
            $transaction = PaymentTransaction::where('paystack_reference', $paystackReference)->firstOrFail();

            if ($transaction->isRecorded()) {
                return $transaction;
            }

            // 2. Verify with Paystack
            $verification = $this->verifyPaymentWithRetry($paystackReference);

            $transaction->update(['last_checked_at' => now()]);

            if ($verification['status'] !== 'success') {
                $transaction->update([
                    'status' => 'failed',
                    'error_code' => 'PAYMENT_NOT_SUCCESSFUL',
                ]);

                return $transaction;
            }

            // 3. Record transaction
            $transaction->update([
                'status' => 'success',
                'payment_method' => $verification['payment_method'] ?? null,
                'customer_email' => $verification['customer_email'] ?? null,
                'verified_at' => now(),
                'last_checked_at' => now(),
            ]);

            // 4. Save authorization code (Disabled - manual transfer payments only)
            /*
            if (! empty($verification['authorization']['authorization_code'])) {
                $auth = $verification['authorization'];
                $customer = $verification['customer'];

                $authData = [
                    'paystack_authorization_code' => $auth['authorization_code'],
                    'paystack_customer_code' => $customer['customer_code'] ?? null,
                    'card_brand' => $auth['brand'] ?? null,
                    'card_last4' => $auth['last4'] ?? null,
                ];

                $residentSubscription = ResidentSubscription::where('user_id', $transaction->user_id)
                    ->where('estate_id', $transaction->estate_id)
                    ->first();

                if ($residentSubscription) {
                    $residentSubscription->update($authData);
                }
            }
            */

            // 5. Mark as recorded
            $transaction->update(['recorded_at' => now()]);

            // 6. PROCESS REFUND
            try {
                $this->paystackService->refund($paystackReference, null, 'Card setup verification refund');

                $metadata = $transaction->metadata ?? [];
                $metadata['refunded_at'] = now()->toDateTimeString();
                $transaction->update(['metadata' => $metadata]);
            } catch (Exception $e) {
                Log::error('Auto-refund failed for card setup', [
                    'reference' => $paystackReference,
                    'error' => $e->getMessage(),
                ]);
            }

            return $transaction;
        });
    }

    /**
     * Get payment transaction history for an invoice (audit trail).
     */
    public function getPaymentHistory(Invoice $invoice)
    {
        return PaymentTransaction::where('invoice_id', $invoice->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Check if a payment is safe to retry.
     */
    public function canRetryPayment(PaymentTransaction $transaction): bool
    {
        return $transaction->status === 'failed'
            && $transaction->attempt_count < self::MAX_RETRY_ATTEMPTS;
    }

    /**
     * Retry a failed payment verification.
     */
    public function retryFailedPayment(PaymentTransaction $transaction): PaymentTransaction
    {
        if (! $this->canRetryPayment($transaction)) {
            throw new Exception('Payment cannot be retried');
        }

        return $this->verifyAndRecordPayment(
            $transaction->paystack_reference,
            $transaction->invoice,
            $transaction->idempotency_key
        );
    }
}
