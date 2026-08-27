<?php

namespace App\Actions\Billing;

use App\Models\Coupon;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Services\BillingCycleService;
use App\Services\CouponService;
use App\Services\PaystackService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessResidentPaymentAction
{
    public function __construct(
        private BillingCycleService $billingCycleService,
        private InitializeInvoicePaymentAction $initializeInvoicePaymentAction,
        private CalculateInvoicePricingAction $pricingAction
    ) {}

    /**
     * Atomically create an invoice for the chosen plan and initialize a Paystack checkout.
     *
     * @throws PaymentInitializationException
     */
    public function execute(
        ResidentSubscription $subscription,
        Plan $plan,
        string $callbackUrl,
        string $invoiceShowUrl,
        ?string $couponCode = null
    ): InitializePaymentResult {
        Log::info('ProcessResidentPaymentAction::execute', [
            'user_id' => $subscription->user_id,
            'estate_id' => $subscription->estate_id,
            'plan_id' => $plan->id,
            'coupon_code' => $couponCode,
        ]);

        $existingInvoice = Invoice::where('user_id', $subscription->user_id)
            ->where('estate_id', $subscription->estate_id)
            ->where('status', 'pending')
            ->first();

        if ($existingInvoice) {
            // Check if there is an active transaction we need to verify before cancelling
            $transaction = $existingInvoice->paymentTransactions()
                ->whereIn('status', ['pending', 'success'])
                ->first();

            if ($transaction) {
                try {
                    $paystackService = app(PaystackService::class);
                    $verification = $paystackService->verifyPayment($transaction->paystack_reference);

                    if ($verification['status'] === 'success') {
                        app(RecordPaymentAction::class)->execute(
                            $existingInvoice,
                            $transaction->paystack_reference,
                            $transaction->idempotency_key
                        );

                        throw new PaymentInitializationException(
                            'We found a recently successful payment for your account. Your subscription has been updated!',
                            'already_paid'
                        );
                    }
                } catch (PaymentInitializationException $e) {
                    throw $e;
                } catch (\Exception $e) {
                    // Verification failed or transaction is abandoned, safe to proceed and cancel it
                    Log::warning('ProcessResidentPaymentAction: Failed to verify existing pending transaction, assuming abandoned.', [
                        'invoice_id' => $existingInvoice->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Cancel the abandoned invoice to prevent duplicates
            $existingInvoice->update(['status' => 'cancelled']);
        }

        $invoice = DB::transaction(function () use ($subscription, $plan, $couponCode) {
            $estate = $subscription->estate;

            // Period starts when the resident's current active/trial period ends, or today if past due
            $periodStart = (in_array($subscription->status, ['active', 'trial']) && $subscription->current_period_end && $subscription->current_period_end->isFuture())
                ? $subscription->current_period_end
                : now()->startOfDay();

            $periodEnd = $this->billingCycleService->calculatePeriodEnd($periodStart, $plan->billing_interval);
            $dueDate = $periodStart->copy()->addDays(7);

            // Handle coupon validation and discount calculation
            $coupon = null;
            if ($couponCode) {
                $coupon = Coupon::where('code', $couponCode)->first();
                if (!$coupon) {
                    throw new PaymentInitializationException(
                        'Invalid coupon code.',
                        'invalid_coupon'
                    );
                }
            }

            $pricing = $this->pricingAction->execute(
                $plan->price ?? 0,
                $coupon,
                $subscription->user,
                $estate,
                $subscription
            );

            if (isset($pricing['metadata']['coupon_error']) && $couponCode) {
                throw new PaymentInitializationException(
                    $pricing['metadata']['coupon_error'],
                    'invalid_coupon'
                );
            }

            // Generate unique invoice number
            $invoiceNumber = $this->billingCycleService->generateInvoiceNumber($estate->id, $subscription->user_id);

            // Create the pending invoice that serves as the transaction base
            return Invoice::create([
                'estate_id' => $estate->id,
                'user_id' => $subscription->user_id,
                'plan_id' => $plan->id,
                'estate_subscription_id' => null, // Not tied to estate's bulk subscription
                'invoice_number' => $invoiceNumber,
                'amount' => $pricing['amount'],
                'resident_count' => 1,
                'billing_period_start' => $periodStart,
                'billing_period_end' => $periodEnd,
                'due_date' => $dueDate,
                'status' => 'pending',
                'metadata' => $pricing['metadata'],
            ]);
        });

        // Initialize the actual payment flow via Paystack using the standard checkout handler
        return $this->initializeInvoicePaymentAction->execute(
            $invoice,
            $callbackUrl,
            $invoiceShowUrl
        );
    }
}
