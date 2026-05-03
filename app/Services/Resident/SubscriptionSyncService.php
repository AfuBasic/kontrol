<?php

namespace App\Services\Resident;

use App\Models\Estate;
use App\Models\ResidentSubscription;
use App\Models\User;
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

        $subscription = ResidentSubscription::firstOrCreate(
            ['user_id' => $user->id, 'estate_id' => $estate->id],
            [
                'status' => 'active', // Default to active if newly created
                'billing_preference' => 'manual',
            ]
        );

        // Case 1: Estate pays for everyone
        if ($chargeType === 'estate') {
            if ($subscription->plan_id !== $estatePlanId) {
                $subscription->update(['plan_id' => $estatePlanId]);
                Log::info("Synced resident {$user->id} to estate plan {$estatePlanId} (Estate Pays mode)");
            }
            return;
        }

        // Case 2: Residents pay for themselves
        // If they have no plan selected yet, we might want to set them to the estate's default tier
        // But we should be careful not to overwrite a plan they've already chosen/paid for
        if ($subscription->plan_id === null) {
            // Default to estate's current plan tier as their starting point
            $subscription->update(['plan_id' => $estatePlanId]);
            Log::info("Initialized resident {$user->id} with estate default plan {$estatePlanId}");
        }
        
        // Note: We don't automatically upgrade/downgrade paid residents if the estate upgrades,
        // as they are billed individually. They must choose to upgrade.
    }
}
