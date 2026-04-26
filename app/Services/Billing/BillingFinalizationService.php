<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\ResidentSubscription;
use App\Services\BillingCycleService;
use App\Mail\Resident\InvoicePaidMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class BillingFinalizationService
{
    public function __construct(
        private BillingCycleService $billingCycleService
    ) {}

    /**
     * Finalize an invoice and its associated subscription after successful payment.
     */
    public function finalizeSuccess(Invoice $invoice, array $paymentData): void
    {
        DB::transaction(function () use ($invoice, $paymentData) {
            // 1. Update Invoice
            $metadata = $invoice->metadata ?? [];
            $metadata['finalized_at'] = now()->toDateTimeString();
            $metadata['attempts'] = ($metadata['attempts'] ?? 0) + 1;

            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
                'paystack_reference' => $paymentData['reference'] ?? $invoice->paystack_reference,
                'metadata' => $metadata,
            ]);

            // 2. Handle Subscription Advancement
            if ($invoice->user_id) {
                $this->finalizeResidentSubscription($invoice);
            } else {
                $this->finalizeEstateSubscription($invoice);
            }

            // 3. Record Transaction if it doesn't exist
            $this->ensureTransactionRecorded($invoice, $paymentData);

            // 4. Notify User (only if it's a resident invoice)
            if ($invoice->user_id && $invoice->user) {
                Mail::to($invoice->user->email)->send(new InvoicePaidMail($invoice));
            }
        });
    }

    private function finalizeResidentSubscription(Invoice $invoice): void
    {
        $subscription = ResidentSubscription::where('user_id', $invoice->user_id)
            ->where('estate_id', $invoice->estate_id)
            ->first();

        if ($subscription) {
            $estateSub = $invoice->estate->subscriptionRecord;
            $interval = $estateSub->billing_interval ?? 'monthly';

            // Accurate capture: if they were overdue/trial, start from today.
            // Otherwise, start from the end of the previous period.
            $newStart = ($subscription->status === 'trial' || $subscription->status === 'past_due') 
                ? now() 
                : ($subscription->current_period_end ?? now());
            
            $newEnd = $this->billingCycleService->calculatePeriodEnd($newStart, $interval);

            $subscription->update([
                'status' => 'active',
                'current_period_start' => $newStart,
                'current_period_end' => $newEnd,
                'last_paid_at' => now(),
            ]);
        }
    }

    private function finalizeEstateSubscription(Invoice $invoice): void
    {
        $subscription = $invoice->estate->subscriptionRecord;

        if ($subscription) {
            $newStart = ($subscription->status === 'trial' || $subscription->status === 'past_due') 
                ? now() 
                : ($subscription->next_billing_date ?? now());

            $newEnd = $this->billingCycleService->calculatePeriodEnd($newStart, $subscription->billing_interval);

            $subscription->update([
                'status' => 'active',
                'next_billing_date' => $newEnd,
                'last_paid_at' => now(),
            ]);
        }
    }

    private function ensureTransactionRecorded(Invoice $invoice, array $paymentData): void
    {
        PaymentTransaction::updateOrCreate(
            ['paystack_reference' => $paymentData['reference'] ?? $invoice->paystack_reference],
            [
                'estate_id' => $invoice->estate_id,
                'user_id' => $invoice->user_id,
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
                'status' => 'success',
                'payment_method' => $paymentData['payment_method'] ?? 'card',
                'customer_email' => $paymentData['customer_email'] ?? null,
                'idempotency_key' => 'payment_' . ($paymentData['reference'] ?? $invoice->paystack_reference),
                'verified_at' => now(),
                'recorded_at' => now(),
            ]
        );
    }
}
