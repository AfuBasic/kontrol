<?php

namespace App\Services;

use App\Models\Estate;
use App\Models\ResidentSubscription;
use App\Models\User;

class ResidentSubscriptionService
{
    /**
     * Create a subscription for a resident if the estate requires it.
     */
    public function createForUser(User $user, Estate $estate): ?ResidentSubscription
    {
        $settings = $estate->settings;

        if ($settings->charge_type !== 'residents') {
            return null;
        }

        $now = now();
        $isTrialAvailable = $settings->free_trial_enabled && ($settings->free_trial_days ?? 0) > 0;

        if ($isTrialAvailable) {
            $trialDays = $settings->free_trial_days;

            return ResidentSubscription::create([
                'user_id' => $user->id,
                'estate_id' => $estate->id,
                'status' => 'trial',
                'trial_ends_at' => $now->copy()->addDays($trialDays),
                'current_period_start' => $now,
                'current_period_end' => $now->copy()->addDays($trialDays),
            ]);
        }

        // No trial available, put in grace period (past_due)
        $graceDays = $settings->grace_period_days ?? 2;

        return ResidentSubscription::create([
            'user_id' => $user->id,
            'estate_id' => $estate->id,
            'status' => 'past_due',
            'trial_ends_at' => null,
            'current_period_start' => $now,
            'current_period_end' => $now->copy()->addDays($graceDays),
        ]);
    }
}
