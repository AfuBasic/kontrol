<?php

namespace App\Jobs\Billing;

use App\Models\Estate;
use App\Models\ResidentSubscription;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncEstateTrialSettingsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Estate $estate
    ) {}

    public function handle(): void
    {
        $estate = $this->estate->fresh(['settings', 'subscriptionRecord']);

        if (! $estate || ! $estate->settings) {
            return;
        }

        $settings = $estate->settings;
        $chargeType = $settings->charge_type ?? 'residents';
        $isTrialEnabled = (bool) ($settings->free_trial_enabled ?? true);
        $trialDays = (int) ($settings->free_trial_days ?? 30);

        if ($chargeType === 'residents') {
            $subscriptions = ResidentSubscription::where('estate_id', $estate->id)->get();

            foreach ($subscriptions as $subscription) {
                // If resident has an active paid plan or has paid before, do not modify
                if ($subscription->status === 'active' && $subscription->plan_id !== null) {
                    continue;
                }

                if (! $isTrialEnabled || $trialDays <= 0) {
                    $subscription->update([
                        'status' => 'past_due',
                        'trial_ends_at' => null,
                        'current_period_end' => $subscription->created_at,
                    ]);

                    continue;
                }

                $createdAt = $subscription->created_at ?? now();
                $newTrialEndsAt = $createdAt->copy()->addDays($trialDays);

                if ($newTrialEndsAt->isPast()) {
                    $subscription->update([
                        'status' => 'past_due',
                        'trial_ends_at' => $newTrialEndsAt,
                        'current_period_end' => $newTrialEndsAt,
                    ]);
                } else {
                    $subscription->update([
                        'status' => 'trial',
                        'trial_ends_at' => $newTrialEndsAt,
                        'current_period_end' => $newTrialEndsAt,
                    ]);
                }
            }
        } elseif ($chargeType === 'estate') {
            $estateSub = $estate->subscriptionRecord;
            if ($estateSub && $estateSub->status === 'trial') {
                $createdAt = $estate->created_at ?? now();
                $newTrialEndsAt = $createdAt->copy()->addDays($trialDays);

                if (! $isTrialEnabled || $trialDays <= 0 || $newTrialEndsAt->isPast()) {
                    $estateSub->update([
                        'status' => 'active',
                        'trial_ends_at' => null,
                    ]);
                } else {
                    $estateSub->update([
                        'status' => 'trial',
                        'trial_ends_at' => $newTrialEndsAt,
                    ]);
                }
            }
        }
    }
}
