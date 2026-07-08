<?php

namespace App\Services\Commission;

use App\Enums\CommissionStatus;
use App\Models\CommissionableRevenue;
use App\Models\Estate;
use App\Models\PaymentTransaction;
use App\Models\User;

class CommissionService
{
    public function eligibleForCommission(Estate $estate): bool
    {
        if (! $estate->partner_id) {
            return false;
        }

        if ($estate->commission_status !== CommissionStatus::Active) {
            return false;
        }

        return $estate->hasActiveCommissionWindow();
    }

    public function generateCommission(User $resident, PaymentTransaction $transaction): ?CommissionableRevenue
    {
        $estate = $transaction->estate ?? $resident->estates()->first();

        if (! $estate || ! $this->eligibleForCommission($estate)) {
            return null;
        }

        $estate->loadMissing('commissionPlan');

        if (! $estate->commissionPlan) {
            return null;
        }

        $commissionRate = (float) $estate->commissionPlan->commission_rate;
        $commissionAmount = (int) round($transaction->amount * ($commissionRate / 100));

        return CommissionableRevenue::create([
            'estate_id' => $estate->id,
            'partner_id' => $estate->partner_id,
            'commission_plan_id' => $estate->commission_plan_id,
            'user_id' => $resident->id,
            'payment_transaction_id' => $transaction->id,
            'revenue_amount' => $transaction->amount,
            'commission_amount' => $commissionAmount,
            'status' => 'pending',
        ]);
    }
}
