<?php

namespace App\Actions\Billing;

use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\ResidentSubscription;
use App\Models\EstateSubscription;
use App\Services\Billing\PaymentVerificationService;
use App\Services\PaystackService;
use App\Actions\Billing\RecordPaymentAction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InitializeInvoicePaymentAction
{
    public function __construct(
        private PaystackService $paystackService,
        private PaymentVerificationService $verificationService,
        private RecordPaymentAction $recordPaymentAction,
    ) {}

    /**
     * Initialize (or resume) a Paystack checkout for the given invoice.
     *
     * Returns a structured result describing the redirect target and an optional flash
     * message so the calling controller can wire it into its own success/info routing.
     *
     * Encapsulates: pending-transaction reuse, success-state verification, fresh
     * transaction creation + Paystack init, and Paystack `duplicate_reference` retry.
     *
     * @throws PaymentInitializationException on unrecoverable initialization failure
     */
    public function execute(
        Invoice $invoice,
        string $paystackCallbackUrl,
        string $invoiceShowUrl,
    ): InitializePaymentResult {
        if ($invoice->isPaid()) {
            throw new PaymentInitializationException('Invoice is already paid.', 'already_paid');
        }

        if ($invoice->amount <= 0) {
            throw new PaymentInitializationException('Invoice amount must be positive to initialize payment.', 'invalid_amount');
        }

        if ($invoice->estate->subscriptionRecord?->status === 'cancelled') {
            throw new PaymentInitializationException('Estate subscription is cancelled. Payments are no longer accepted.', 'subscription_cancelled');
        }

        Log::info('InitializeInvoicePaymentAction::execute', ['invoice_id' => $invoice->id]);

        $existing = PaymentTransaction::where('invoice_id', $invoice->id)
            ->whereIn('status', ['pending', 'success'])
            ->latest()
            ->first();

        if ($existing && $existing->status === 'success' && ! $existing->recorded_at) {
            $this->verificationService->verifyAndRecordPayment(
                $existing->paystack_reference,
                $invoice,
                $existing->idempotency_key,
            );

            return InitializePaymentResult::flash(
                $invoiceShowUrl,
                'success',
                'Payment verified and recorded!',
            );
        }

        if ($existing && $existing->status === 'pending') {
            $url = $existing->metadata['authorization_url'] ?? $invoiceShowUrl;

            return InitializePaymentResult::flash(
                $url,
                'info',
                'Returning to existing payment checkout. Please complete the payment.',
            );
        }

        // 1. ATTEMPT CHARGE VIA SAVED CARD (One-click payment)
        $authorizationCode = $this->getSavedAuthorizationCode($invoice);

        if ($authorizationCode) {
            try {
                $email = $invoice->user->email ?? $invoice->estate->email ?? $invoice->estate->users()->first()?->email;
                
                $chargeResult = $this->paystackService->chargeAuthorization(
                    $authorizationCode,
                    $email,
                    $invoice->amount,
                    $invoice->invoice_number,
                    ['invoice_id' => $invoice->id, 'manual_initiation' => true]
                );

                if ($chargeResult['status'] === 'success') {
                    $this->recordPaymentAction->execute(
                        $invoice,
                        $chargeResult['reference'],
                        'manual_charge_' . $chargeResult['reference']
                    );

                    return InitializePaymentResult::flash(
                        $invoiceShowUrl,
                        'success',
                        'Payment successful! Your saved card was charged.'
                    );
                }
            } catch (\Exception $e) {
                Log::warning('Manual charge via saved card failed, falling back to standard checkout', [
                    'invoice_id' => $invoice->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $transaction = PaymentTransaction::create([
            'invoice_id' => $invoice->id,
            'estate_id' => $invoice->estate_id,
            'paystack_reference' => $invoice->invoice_number,
            'idempotency_key' => (string) Str::uuid(),
            'amount' => $invoice->amount,
            'currency' => 'NGN',
            'status' => 'pending',
            'attempt_count' => 1,
        ]);

        try {
            $payment = $this->paystackService->initializePayment($invoice, $paystackCallbackUrl);

            $this->persistPaymentMetadata($transaction, $invoice, $payment);

            return InitializePaymentResult::redirect($payment['authorization_url']);
        } catch (\Exception $e) {
            $errorData = json_decode($e->getMessage(), true);

            if (($errorData['code'] ?? null) === 'duplicate_reference') {
                $retry = $this->retryWithVerificationOrSuffix($invoice, $transaction, $paystackCallbackUrl, $invoiceShowUrl);

                if ($retry !== null) {
                    return $retry;
                }
            }

            if ($transaction->exists) {
                $transaction->delete();
            }

            throw PaymentInitializationException::fromPaystackException($e);
        }
    }

    /**
     * On `duplicate_reference`, first try verifying the original reference; if that
     * fails, retry initialization with a suffixed reference (bounded by max retries).
     */
    private function retryWithVerificationOrSuffix(
        Invoice $invoice,
        PaymentTransaction $transaction,
        string $paystackCallbackUrl,
        string $invoiceShowUrl,
    ): ?InitializePaymentResult {
        try {
            $verification = $this->paystackService->verifyPayment($invoice->invoice_number);

            if ($verification['status'] === 'success') {
                $this->verificationService->verifyAndRecordPayment(
                    $invoice->invoice_number,
                    $invoice,
                    null,
                );

                return InitializePaymentResult::flash(
                    $invoiceShowUrl,
                    'success',
                    'Payment verified and recorded successfully!',
                );
            }
        } catch (\Exception) {
            // fall through to retry path
        }

        if ($transaction->attempt_count >= PaymentVerificationService::MAX_RETRY_ATTEMPTS) {
            $transaction->delete();

            throw new PaymentInitializationException(
                'Too many payment attempts for this invoice. Please contact support.',
                'max_retries_exceeded',
            );
        }

        $transaction->increment('attempt_count');
        $transaction->refresh();
        $newReference = $invoice->invoice_number.'_'.$transaction->attempt_count;

        try {
            $payment = $this->paystackService->initializePayment($invoice, $paystackCallbackUrl, $newReference);

            $this->persistPaymentMetadata($transaction, $invoice, $payment, [
                'original_reference' => $invoice->invoice_number,
            ]);

            return InitializePaymentResult::redirect($payment['authorization_url']);
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * @param  array{reference: string, access_code: string, authorization_url: string}  $payment
     * @param  array<string, mixed>  $extraMetadata
     */
    private function persistPaymentMetadata(
        PaymentTransaction $transaction,
        Invoice $invoice,
        array $payment,
        array $extraMetadata = [],
    ): void {
        $transaction->update([
            'paystack_reference' => $payment['reference'],
            'metadata' => array_merge([
                'access_code' => $payment['access_code'],
                'authorization_url' => $payment['authorization_url'],
            ], $extraMetadata),
        ]);

        $invoice->update(['paystack_access_code' => $payment['access_code']]);
    }

    /**
     * Get saved authorization code for the invoice target (Resident or Estate).
     */
    private function getSavedAuthorizationCode(Invoice $invoice): ?string
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
}
