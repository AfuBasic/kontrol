<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\ResidentSubscription;
use App\Notifications\Resident\InvoicePaidNotification;
use App\Services\BillingCycleService;
use App\Services\Commission\CommissionService;
use App\Services\CouponService;
use Illuminate\Support\Facades\DB;

class BillingFinalizationService
{
    public function __construct(
        private BillingCycleService $billingCycleService,
        private CommissionService $commissionService,
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

            // 2.5 Log Coupon Usage if coupon_code was applied
            if (! empty($metadata['coupon_code'])) {
                app(CouponService::class)->logCouponUsage($invoice, $metadata['coupon_code']);
            }

            // 2.6 Persist Card Authorization if provided in paymentData
            if (! empty($paymentData['authorization']['authorization_code']) && ($paymentData['payment_method'] ?? '') === 'card') {
                $auth = $paymentData['authorization'];
                $customer = $paymentData['customer'] ?? [];

                $authData = [
                    'paystack_authorization_code' => $auth['authorization_code'],
                    'paystack_customer_code' => $customer['customer_code'] ?? null,
                    'card_brand' => $auth['brand'] ?? $auth['card_type'] ?? null,
                    'card_last4' => $auth['last4'] ?? null,
                ];

                if (! empty($metadata['auto_renew_consent'])) {
                    $authData['auto_renew_enabled'] = true;
                }

                if ($invoice->user_id) {
                    $sub = ResidentSubscription::where('user_id', $invoice->user_id)
                        ->where('estate_id', $invoice->estate_id)
                        ->first();
                    if ($sub) {
                        $sub->update($authData);
                    }
                } elseif ($invoice->estate && $invoice->estate->subscriptionRecord) {
                    $invoice->estate->subscriptionRecord->update($authData);
                }
            }

            // 3. Record Transaction if it doesn't exist
            $transaction = $this->ensureTransactionRecorded($invoice, $paymentData);

            // 4. Notify User (only if it's a resident invoice)
            if ($invoice->user_id && $invoice->user) {
                $this->commissionService->generateCommission($invoice->user, $transaction);
                $invoice->user->notify(new InvoicePaidNotification($invoice));
            }
        });
    }

    private function finalizeResidentSubscription(Invoice $invoice): void
    {
        $subscription = ResidentSubscription::where('user_id', $invoice->user_id)
            ->where('estate_id', $invoice->estate_id)
            ->first();

        if ($subscription) {
            $interval = $invoice->plan ? $invoice->plan->billing_interval : 'monthly';

            // Accurate capture: if they have a future end date and are active or on trial, start from that end date.
            // Otherwise (e.g. past due), start from today.
            $newStart = (in_array($subscription->status, ['active', 'trial']) && $subscription->current_period_end && $subscription->current_period_end->isFuture())
                ? $subscription->current_period_end
                : now();

            $newEnd = $this->billingCycleService->calculatePeriodEnd($newStart, $interval);

            $subscription->update([
                'plan_id' => $invoice->plan_id, // Save the plan they just bought
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

    private function ensureTransactionRecorded(Invoice $invoice, array $paymentData): PaymentTransaction
    {
        $invoiceMetadata = $invoice->metadata ?? [];
        $transactionMetadata = array_merge(
            $paymentData['metadata'] ?? [],
            ! empty($invoiceMetadata['coupon_code']) ? ['coupon_code' => $invoiceMetadata['coupon_code']] : []
        );

        return PaymentTransaction::updateOrCreate(
            ['paystack_reference' => $paymentData['reference'] ?? $invoice->paystack_reference],
            [
                'estate_id' => $invoice->estate_id,
                'user_id' => $invoice->user_id,
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
                'status' => 'success',
                'payment_method' => $paymentData['payment_method'] ?? 'card',
                'customer_email' => $paymentData['customer_email'] ?? null,
                'idempotency_key' => 'payment_'.($paymentData['reference'] ?? $invoice->paystack_reference),
                'verified_at' => now(),
                'recorded_at' => now(),
                'metadata' => $transactionMetadata,
            ]
        );
    }
}
