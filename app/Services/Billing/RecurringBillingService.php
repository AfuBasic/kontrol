<?php

namespace App\Services\Billing;

use App\Models\EstateSubscription;
use App\Models\Invoice;
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
        $dueSubscriptions = EstateSubscription::where('status', 'active')
            ->where('billing_preference', 'auto')
            ->whereNotNull('paystack_authorization_code')
            ->where('next_billing_date', '<=', now())
            ->whereHas('estate.settings', function ($query) {
                $query->where('charge_type', 'estate');
            })
            ->get();

        foreach ($dueSubscriptions as $subscription) {
            $this->chargeEstateSubscription($subscription);
        }
    }

    /**
     * Process Resident-level subscriptions (where charge_type = 'residents').
     */
    public function processDueResidentSubscriptions(): void
    {
        $dueSubscriptions = ResidentSubscription::where('status', 'active')
            ->where('billing_preference', 'auto')
            ->whereNotNull('paystack_authorization_code')
            ->where('current_period_end', '<=', now())
            ->whereHas('estate.settings', function ($query) {
                $query->where('charge_type', 'residents');
            })
            ->get();

        foreach ($dueSubscriptions as $subscription) {
            $this->chargeResidentSubscription($subscription);
        }
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
     * Common charge execution logic.
     */
    private function executeCharge(Invoice $invoice, string $authCode): void
    {
        $email = $invoice->user->email ?? $invoice->estate->email ?? $invoice->estate->users()->first()?->email;

        $chargeResult = $this->paystackService->chargeAuthorization(
            $authCode,
            $email,
            $invoice->amount,
            $invoice->invoice_number,
            [
                'invoice_id' => $invoice->id,
                'is_recurring' => true,
            ]
        );

        if ($chargeResult['status'] === 'success') {
            // Record payment locally
            $this->recordPaymentAction->execute(
                $invoice,
                $chargeResult['reference'],
                'auto_'.$chargeResult['reference']
            );

            Log::info('Auto-charge successful', [
                'invoice_id' => $invoice->id,
                'reference' => $chargeResult['reference'],
            ]);
        } else {
            throw new \Exception('Charge result status not success: '.$chargeResult['status']);
        }
    }
}
