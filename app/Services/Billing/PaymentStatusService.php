<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Services\PaystackService;
use Illuminate\Support\Collection;

class PaymentStatusService
{
    public function __construct(
        private PaystackService $paystackService,
        private PaymentVerificationService $verificationService,
    ) {}

    /**
     * Check if an invoice payment was recorded successfully.
     */
    public function isInvoicePaid(Invoice $invoice): bool
    {
        return $invoice->isPaid();
    }

    /**
     * Get detailed payment status for an invoice.
     */
    public function getPaymentStatus(Invoice $invoice): array
    {
        // Check if invoice is already marked as paid
        if ($invoice->isPaid()) {
            return [
                'status' => 'paid',
                'invoice_status' => 'paid',
                'paid_at' => $invoice->paid_at?->toDateString(),
                'reference' => $invoice->paystack_reference,
                'message' => 'Payment has been recorded successfully.',
            ];
        }

        // Check payment transactions for this invoice
        $latestTransaction = PaymentTransaction::where('invoice_id', $invoice->id)
            ->latest()
            ->first();

        if (! $latestTransaction) {
            return [
                'status' => 'not_initiated',
                'invoice_status' => 'pending',
                'message' => 'No payment attempt found for this invoice.',
            ];
        }

        return [
            'status' => $latestTransaction->status,
            'invoice_status' => $invoice->status,
            'reference' => $latestTransaction->paystack_reference,
            'amount' => $latestTransaction->amount,
            'attempt_count' => $latestTransaction->attempt_count,
            'verified_at' => $latestTransaction->verified_at?->toDateString(),
            'error_code' => $latestTransaction->error_code,
            'error_message' => $latestTransaction->error_message,
            'message' => $this->getStatusMessage($latestTransaction),
            'can_retry' => $this->verificationService->canRetryPayment($latestTransaction),
        ];
    }

    /**
     * Verify payment with Paystack and update local status if needed.
     * Useful if payment succeeded on Paystack but callback didn't happen.
     */
    public function verifyAndSyncPayment(Invoice $invoice, string $paystackReference): array
    {
        try {
            // Verify with Paystack
            $verification = $this->paystackService->verifyPayment($paystackReference);

            if ($verification['status'] === 'success') {
                // Payment successful on Paystack - try to record if not already recorded
                if (! $invoice->isPaid()) {
                    $this->verificationService->verifyAndRecordPayment(
                        $paystackReference,
                        $invoice,
                        'retry_verification_'.$invoice->id.'_'.now()->timestamp
                    );

                    $invoice->refresh();
                }

                return [
                    'status' => 'success',
                    'invoice_status' => $invoice->status,
                    'message' => 'Payment verified with Paystack and recorded successfully!',
                    'paid' => $invoice->isPaid(),
                ];
            }

            return [
                'status' => 'not_completed',
                'message' => 'Payment not completed on Paystack. Please try again.',
                'paystack_status' => $verification['status'] ?? 'unknown',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'verification_error',
                'message' => 'Could not verify payment with Paystack. Please try again later.',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get all payment attempts for an invoice (audit trail).
     */
    public function getPaymentHistory(Invoice $invoice): Collection
    {
        return PaymentTransaction::where('invoice_id', $invoice->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($transaction) => [
                'reference' => $transaction->paystack_reference,
                'status' => $transaction->status,
                'amount' => $transaction->amount,
                'attempt' => $transaction->attempt_count,
                'verified_at' => $transaction->verified_at?->toDateString(),
                'recorded_at' => $transaction->recorded_at?->toDateString(),
                'error' => $transaction->error_message,
                'timestamp' => $transaction->created_at?->toDateString(),
            ]);
    }

    /**
     * Generate user-friendly status message.
     */
    private function getStatusMessage(PaymentTransaction $transaction): string
    {
        return match ($transaction->status) {
            'success' => $transaction->recorded_at
                ? 'Payment verified and recorded successfully.'
                : 'Payment verified with Paystack, waiting to be recorded...',
            'failed' => 'Payment failed: '.$transaction->error_message,
            'pending' => 'Payment verification in progress...',
            default => 'Unknown payment status.',
        };
    }

    /**
     * Check if a payment is safe to retry.
     */
    public function canRetryPayment(Invoice $invoice): bool
    {
        if ($invoice->isPaid()) {
            return false;
        }

        $latestTransaction = PaymentTransaction::where('invoice_id', $invoice->id)->latest()->first();

        return $latestTransaction && $this->verificationService->canRetryPayment($latestTransaction);
    }
}
