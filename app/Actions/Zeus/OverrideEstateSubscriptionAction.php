<?php

namespace App\Actions\Zeus;

use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Plan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OverrideEstateSubscriptionAction
{
    /**
     * @param  array{plan_id: int, status: string, billing_interval: string, notes?: string}  $data
     */
    public function execute(Estate $estate, array $data): EstateSubscription
    {
        return DB::transaction(function () use ($estate, $data) {
            $plan = Plan::findOrFail($data['plan_id']);

            $subscription = $estate->subscriptionRecord() ?? new EstateSubscription(['estate_id' => $estate->id]);

            $subscription->update([
                'plan_id' => $plan->id,
                'status' => $data['status'],
                'billing_interval' => $data['billing_interval'],
                'overridden_by' => Auth::id(),
                'override_notes' => $data['notes'] ?? null,
            ]);

            return $subscription;
        });
    }
}
