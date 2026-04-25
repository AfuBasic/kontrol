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

        $trialDays = $settings->free_trial_days ?? 0;
        $now = now();

        return ResidentSubscription::create([
            'user_id' => $user->id,
            'estate_id' => $estate->id,
            'status' => $trialDays > 0 ? 'trial' : 'active',
            'trial_ends_at' => $trialDays > 0 ? $now->addDays($trialDays) : null,
            'current_period_start' => $now,
            'current_period_end' => $now->copy()->addMonth(), // Default to 1 month
        ]);
    }
}
