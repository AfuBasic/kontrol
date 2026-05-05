<?php

namespace App\Services\Billing;

use App\Actions\Billing\GenerateInvoiceAction;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

class InitializeTrialService
{
    public function __construct(
        private GenerateInvoiceAction $generateInvoiceAction,
    ) {}

    /**
     * Initialize or correct trial period for a subscription based on estate creation date.
     * If free trial is enabled and estate was created less than trial_days ago, set to trial status.
     * If trial expired or disabled, set to active and generate first invoice if needed.
     */
    public function initializeForEstate(Estate $estate): EstateSubscription
    {
        return DB::transaction(function () use ($estate) {
            $subscription = $estate->subscriptionRecord;

            if (! $subscription || ! $subscription->plan) {
                return $subscription;
            }

            // Get trial settings from estate
            $settings = $estate->settings;
            $isTrialEnabled = $settings->free_trial_enabled ?? true;
            $trialDays = $settings->free_trial_days ?? 30;

            // Calculate trial period based on estate creation date and configured trial days
            $trialEndsAt = $estate->created_at->addDays($trialDays);
            $now = now();

            // Check if any invoices exist for this estate
            $hasInvoices = Invoice::where('estate_id', $estate->id)->exists();

            if ($isTrialEnabled && $now->isBefore($trialEndsAt) && ($settings->charge_type !== 'residents')) {
                // Still in trial period and trial is enabled (and estate pays)
                $subscription->update([
                    'status' => 'trial',
                    'trial_ends_at' => $trialEndsAt,
                    'billing_anchor_day' => null,  // Will be set when first invoice is generated
                    'next_billing_date' => null,
                ]);
            } else {
                // Trial period has expired, is disabled, or estate doesn't pay (residents pay)
                $subscription->update([
                    'status' => 'active',
                    'trial_ends_at' => ($settings->charge_type === 'residents') ? null : $trialEndsAt,
                ]);

                if (! $hasInvoices && ($settings->charge_type !== 'residents')) {
                    // Generate first invoice retroactively if estate pays
                    $this->generateInvoiceAction->execute($estate, isFirstInvoice: true);
                }
            }

            return $subscription->fresh();
        });
    }

    /**
     * Initialize trial for all subscriptions that don't have it set.
     * Useful for running as a one-time data correction.
     */
    public function initializeAllMissing(): int
    {
        $subscriptions = EstateSubscription::where('trial_ends_at', null)
            ->orWhere('status', '=', null)
            ->with('estate', 'plan')
            ->get();

        $count = 0;
        foreach ($subscriptions as $subscription) {
            if ($subscription->estate && $subscription->plan) {
                $this->initializeForEstate($subscription->estate);
                $count++;
            }
        }

        return $count;
    }
}
