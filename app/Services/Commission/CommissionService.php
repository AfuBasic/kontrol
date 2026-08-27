<?php

namespace App\Services\Commission;

use App\Enums\CommissionStatus;
use App\Models\CommissionableRevenue;
use App\Models\Estate;
use App\Models\PaymentTransaction;
use App\Models\ResidentSubscription;
use App\Models\User;
use Carbon\CarbonImmutable;

class CommissionService
{
    /**
     * Estate-level gate: partner attributed and commission program active.
     * Tenure length is enforced per-resident (post-trial), not via estate ends_at.
     */
    public function eligibleForCommission(Estate $estate): bool
    {
        if (! $estate->partner_id) {
            return false;
        }

        if ($estate->commission_status !== CommissionStatus::Active) {
            return false;
        }

        $today = CarbonImmutable::now()->startOfDay();

        if ($estate->commission_starts_at && $today->lt(CarbonImmutable::parse($estate->commission_starts_at)->startOfDay())) {
            return false;
        }

        return true;
    }

    public function generateCommission(User $resident, PaymentTransaction $transaction): ?CommissionableRevenue
    {
        if ($transaction->id) {
            $existingRevenue = CommissionableRevenue::where('payment_transaction_id', $transaction->id)->first();

            if ($existingRevenue) {
                return $existingRevenue;
            }
        }

        $estate = $transaction->estate ?? $resident->estates()->first();

        if (! $estate || ! $this->eligibleForCommission($estate)) {
            return null;
        }

        $estate->loadMissing(['commissionPlan', 'partner']);

        if (! $this->residentPaymentIsWithinCommissionTenure($resident, $estate, $transaction)) {
            return null;
        }

        $plan = $estate->commissionPlan;
        $partner = $estate->partner;

        $commissionRate = null;
        $commissionType = null;
        $commissionPlanId = null;

        if ($plan !== null) {
            $commissionRate = (float) $plan->commission_rate;
            $commissionType = $plan->commission_type;
            $commissionPlanId = $plan->id;
        } elseif ($partner !== null && $partner->commission_rate !== null) {
            $commissionRate = (float) $partner->commission_rate;
            $commissionType = $partner->commission_type;
        }

        if ($commissionRate === null || $commissionRate <= 0) {
            return null;
        }

        if ($commissionType === 'fixed') {
            $commissionAmount = (int) $commissionRate;
        } else {
            $commissionAmount = (int) round($transaction->amount * ($commissionRate / 100));
        }

        $revenue = CommissionableRevenue::create([
            'estate_id' => $estate->id,
            'partner_id' => $estate->partner_id,
            'commission_plan_id' => $commissionPlanId,
            'user_id' => $resident->id,
            'payment_transaction_id' => $transaction->id,
            'revenue_amount' => $transaction->amount,
            'commission_amount' => $commissionAmount,
            'status' => 'pending',
        ]);

        app(\App\Services\Zeus\SettlementInboxService::class)->hydrateOpenPeriods();

        return $revenue;
    }

    /**
     * Partner commission length is measured from the resident's post-trial start
     * (calendar months). Trial time does not count. null duration = always eligible after trial.
     */
    public function residentPaymentIsWithinCommissionTenure(
        User $resident,
        Estate $estate,
        PaymentTransaction $transaction,
    ): bool {
        $paymentAt = $this->paymentTimestamp($transaction);

        $subscription = ResidentSubscription::query()
            ->where('user_id', $resident->id)
            ->where('estate_id', $estate->id)
            ->latest('id')
            ->first();

        $tenureStart = $this->resolveCommissionTenureStart($subscription, $paymentAt);

        if ($tenureStart === null) {
            return false;
        }

        if ($paymentAt->lt($tenureStart)) {
            return false;
        }

        $durationMonths = $this->resolveDurationMonths($estate);

        if ($durationMonths === null) {
            return true;
        }

        $eligibleUntil = $tenureStart->addMonths($durationMonths)->endOfDay();

        return $paymentAt->lte($eligibleUntil);
    }

    /**
     * @return CarbonImmutable|null Null while still on unpaid trial (not yet commission-eligible).
     */
    public function resolveCommissionTenureStart(
        ?ResidentSubscription $subscription,
        CarbonImmutable $paymentAt,
    ): ?CarbonImmutable {
        if ($subscription === null) {
            // No subscription row (e.g. non-resident billing) - clock starts at this payment.
            return $paymentAt->startOfDay();
        }

        if ($this->isOnUnpaidTrial($subscription, $paymentAt)) {
            return null;
        }

        if ($subscription->trial_ends_at) {
            $trialEnd = CarbonImmutable::parse($subscription->trial_ends_at)->startOfDay();

            // Early paid conversion: tenure starts on the payment day that ends trial.
            if ($paymentAt->startOfDay()->lt($trialEnd) && $subscription->status !== 'trial') {
                return $paymentAt->startOfDay();
            }

            // Normal path: tenure starts the day trial ends (trial days never count).
            return $trialEnd;
        }

        // Never had a trial - tenure from subscription start.
        $start = $subscription->current_period_start ?? $subscription->created_at;

        return $start
            ? CarbonImmutable::parse($start)->startOfDay()
            : $paymentAt->startOfDay();
    }

    private function isOnUnpaidTrial(ResidentSubscription $subscription, CarbonImmutable $paymentAt): bool
    {
        if ($subscription->status !== 'trial') {
            return false;
        }

        if ($subscription->trial_ends_at) {
            return $paymentAt->lt(CarbonImmutable::parse($subscription->trial_ends_at));
        }

        if ($subscription->current_period_end) {
            return $paymentAt->lt(CarbonImmutable::parse($subscription->current_period_end));
        }

        return true;
    }

    private function resolveDurationMonths(Estate $estate): ?int
    {
        $plan = $estate->commissionPlan;

        if ($plan !== null) {
            // null duration_months on the plan snapshot means always eligible.
            return $plan->duration_months !== null ? (int) $plan->duration_months : null;
        }

        $fromPartner = $estate->partner?->commission_length;

        return $fromPartner !== null ? (int) $fromPartner : null;
    }

    private function paymentTimestamp(PaymentTransaction $transaction): CarbonImmutable
    {
        $raw = $transaction->verified_at ?? $transaction->recorded_at ?? $transaction->created_at ?? now();

        return CarbonImmutable::parse($raw);
    }
}
