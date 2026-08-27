<?php

namespace App\Services\Billing;

use App\Actions\Billing\RecordPaymentAction;
use App\Models\EstateSubscription;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Models\ResidentSubscription;
use App\Services\PaystackService;
use Illuminate\Support\Facades\Log;

class RecurringBillingService
{
    public function __construct(
        private PaystackService $paystackService,
        private InvoiceGenerationService $invoiceGenerationService,
        private RecordPaymentAction $recordPaymentAction,
    ) {}

    /**
     * Process all due subscriptions (Estate and Resident).
     */
    public function processDueSubscriptions(): void
    {
        $this->processDueEstateSubscriptions();
        $this->processDueResidentSubscriptions();
    }

    /**
     * Process Estate-level subscriptions (where charge_type = 'estate').
     */
    public function processDueEstateSubscriptions(): void
    {
        EstateSubscription::where('status', 'active')
            ->where('auto_renew_enabled', true)
            ->whereNotNull('paystack_authorization_code')
            ->whereDate('next_billing_date', '<=', today())
            ->with(['estate.settings'])
            ->get()
            ->filter(fn ($sub) => ($sub->estate->settings->charge_type ?? '') === 'estate')
            ->each(function ($sub) {
                $this->chargeEstateSubscription($sub);
            });
    }

    /**
     * Process Resident-level subscriptions (where charge_type = 'residents').
     */
    public function processDueResidentSubscriptions(): void
    {
        ResidentSubscription::where('status', 'active')
            ->where('auto_renew_enabled', true)
            ->whereNotNull('paystack_authorization_code')
            ->whereDate('current_period_end', '<=', today())
            ->with(['estate.settings'])
            ->get()
            ->filter(fn ($sub) => ($sub->estate->settings->charge_type ?? '') === 'residents')
            ->each(function ($sub) {
                $this->chargeResidentSubscription($sub);
            });
    }

    /**
     * Charge an Estate subscription using saved authorization.
     */
    public function chargeEstateSubscription(EstateSubscription $subscription): void
    {
        try {
            // 1. Get or create pending invoice
            $invoice = $this->invoiceGenerationService->getOrCreatePendingInvoice($subscription->estate);

            if (! $invoice) {
                return;
            }

            // 2. Charge via Paystack
            $this->executeCharge($invoice, $subscription->paystack_authorization_code);

        } catch (\Exception $e) {
            Log::error('Failed to auto-charge estate subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            $subscription->update(['status' => 'past_due']);
        }
    }

    /**
     * Charge a Resident subscription using saved authorization.
     */
    public function chargeResidentSubscription(ResidentSubscription $subscription): void
    {
        try {
            // 1. Get or create pending invoice
            $invoice = $this->invoiceGenerationService->getOrCreatePendingInvoiceForResident($subscription);

            if (! $invoice) {
                return;
            }

            // 2. Charge via Paystack
            $this->executeCharge($invoice, $subscription->paystack_authorization_code);

        } catch (\Exception $e) {
            Log::error('Failed to auto-charge resident subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            $subscription->update(['status' => 'past_due']);
        }
    }

    /**
     * Common charge execution logic with database-enforced idempotency locking.
     */
    private function executeCharge(Invoice $invoice, string $authCode): void
    {
        $email = $invoice->user->email ?? $invoice->estate->email ?? $invoice->estate->users()->first()?->email;
        $chargeReference = $invoice->invoice_number.'-AUTO-'.now()->format('Y-m-d');

        // Check if transaction already exists
        $existingTx = PaymentTransaction::where('paystack_reference', $chargeReference)->first();
        if ($existingTx && $existingTx->status === 'success') {
            return;
        }

        // 1. Create or retrieve the pending PaymentTransaction
        $transaction = PaymentTransaction::firstOrCreate(
            ['paystack_reference' => $chargeReference],
            [
                'invoice_id' => $invoice->id,
                'estate_id' => $invoice->estate_id,
                'user_id' => $invoice->user_id,
                'amount' => $invoice->amount,
                'currency' => 'NGN',
                'status' => 'pending',
                'idempotency_key' => 'idem_'.$chargeReference,
            ]
        );

        // 2. Database lock claim: Ensure only one worker processes this invoice
        $claimed = \Illuminate\Support\Facades\DB::table('invoices')
            ->where('id', $invoice->id)
            ->whereNull('active_payment_attempt_id')
            ->update(['active_payment_attempt_id' => $transaction->id]);

        if (! $claimed && $invoice->active_payment_attempt_id !== $transaction->id) {
            Log::info("Invoice {$invoice->id} is already claimed by another payment attempt.");

            return;
        }

        try {
            // 3. Perform network call outside lock
            $chargeResult = $this->paystackService->chargeAuthorization(
                $authCode,
                $email,
                $invoice->amount,
                $chargeReference,
                [
                    'invoice_id' => $invoice->id,
                    'is_recurring' => true,
                ]
            );

            if (($chargeResult['status'] ?? '') === 'success') {
                // 4. Record successful payment
                $this->recordPaymentAction->execute(
                    $invoice,
                    $chargeResult['reference'] ?? $chargeReference,
                    'auto_'.$chargeReference
                );

                Log::info('Auto-charge successful', [
                    'invoice_id' => $invoice->id,
                    'reference' => $chargeResult['reference'] ?? $chargeReference,
                ]);
            } else {
                throw new \Exception('Charge result status not success: '.($chargeResult['status'] ?? 'unknown'));
            }
        } catch (\Exception $e) {
            // Release claim on failure
            \Illuminate\Support\Facades\DB::table('invoices')
                ->where('id', $invoice->id)
                ->where('active_payment_attempt_id', $transaction->id)
                ->update(['active_payment_attempt_id' => null]);

            throw $e;
        }
    }
}
