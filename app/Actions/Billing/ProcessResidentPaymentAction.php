<?php

namespace App\Actions\Billing;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Services\BillingCycleService;
use App\Services\PaystackService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessResidentPaymentAction
{
    public function __construct(
        private BillingCycleService $billingCycleService,
        private InitializeInvoicePaymentAction $initializeInvoicePaymentAction
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
        string $invoiceShowUrl
    ): InitializePaymentResult {
        Log::info('ProcessResidentPaymentAction::execute', [
            'user_id' => $subscription->user_id,
            'estate_id' => $subscription->estate_id,
            'plan_id' => $plan->id,
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

        $invoice = DB::transaction(function () use ($subscription, $plan) {
            $estate = $subscription->estate;

            // Period starts when the resident's current active period ends, or today if expired/trial/past_due
            $periodStart = ($subscription->status === 'active' && $subscription->current_period_end && $subscription->current_period_end->isFuture())
                ? $subscription->current_period_end
                : now()->startOfDay();

            $periodEnd = $this->billingCycleService->calculatePeriodEnd($periodStart, $plan->billing_interval);
            $dueDate = $periodStart->copy()->addDays(7);

            // Amount is the specific plan's price
            $amount = $plan->price;

            // Generate unique invoice number
            $invoiceNumber = $this->billingCycleService->generateInvoiceNumber($estate->id, $subscription->user_id);

            // Create the pending invoice that serves as the transaction base
            return Invoice::create([
                'estate_id' => $estate->id,
                'user_id' => $subscription->user_id,
                'plan_id' => $plan->id,
                'estate_subscription_id' => null, // Not tied to estate's bulk subscription
                'invoice_number' => $invoiceNumber,
                'amount' => $amount,
                'resident_count' => 1,
                'billing_period_start' => $periodStart,
                'billing_period_end' => $periodEnd,
                'due_date' => $dueDate,
                'status' => 'pending',
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
