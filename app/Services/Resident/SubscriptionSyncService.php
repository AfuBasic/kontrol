<?php

namespace App\Services\Resident;

use App\Models\Estate;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Services\ResidentSubscriptionService;
use Illuminate\Support\Facades\Log;

class SubscriptionSyncService
{
    /**
     * Synchronize a resident's subscription with the estate's current settings.
     * This ensures the resident has the correct plan_id and access level.
     */
    public function sync(User $user, Estate $estate): void
    {
        // Only sync for residents
        if ($user->user_type !== 'user') {
            return;
        }

        $chargeType = $estate->settings->charge_type;
        $estatePlanId = $estate->subscriptionRecord?->plan_id;

        if (! $estatePlanId) {
            return;
        }

        $subscription = ResidentSubscription::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->first();

        // Case 1: Estate pays for everyone
        if ($chargeType === 'estate') {
            if (! $subscription) {
                $subscription = ResidentSubscription::create([
                    'user_id' => $user->id,
                    'estate_id' => $estate->id,
                    'plan_id' => $estatePlanId,
                    'status' => 'active',
                ]);
                Log::info("Created active subscription for resident {$user->id} (Estate Pays mode)");
            } elseif ($subscription->plan_id !== $estatePlanId) {
                $subscription->update(['plan_id' => $estatePlanId]);
                Log::info("Synced resident {$user->id} to estate plan {$estatePlanId} (Estate Pays mode)");
            }

            return;
        }

        // Case 2: Residents pay for themselves
        if (! $subscription) {
            $subscription = app(ResidentSubscriptionService::class)->createForUser($user, $estate);
            Log::info("Initialized resident {$user->id} subscription via ResidentSubscriptionService");

            return;
        }

        // Clean up plan_id if null
        if ($subscription->plan_id === null) {
            $subscription->update(['plan_id' => $estatePlanId]);
            Log::info("Initialized resident {$user->id} with estate default plan {$estatePlanId}");
        }

        // Heal dates if they are missing
        if ($subscription->current_period_end === null) {
            if ($subscription->status === 'trial') {
                $trialDays = $estate->settings->free_trial_days ?? 30;
                $subscription->update([
                    'trial_ends_at' => $subscription->created_at->copy()->addDays($trialDays),
                    'current_period_start' => $subscription->created_at,
                    'current_period_end' => $subscription->created_at->copy()->addDays($trialDays),
                ]);
            } else {
                $subscription->update([
                    'current_period_start' => $subscription->created_at,
                    'current_period_end' => $subscription->created_at,
                ]);
            }
            Log::info("Healed missing dates on subscription for resident {$user->id}");
        }
    }
}
