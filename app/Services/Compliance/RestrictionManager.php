<?php

namespace App\Services\Compliance;

use App\Models\Compliance\Restriction;
use App\Models\Compliance\Violation;
use App\Models\User;

class RestrictionManager
{
    /**
     * Features that are strictly protected and CANNOT be restricted by any policy.
     * Visitor Pass generation is explicitly protected per platform policy.
     */
    protected array $protectedFeatures = [
        'visitor_pass.create',
        'visitor_pass.generate',
        'visitor_pass',
    ];

    public function __construct(
        protected TimelineRecorder $timelineRecorder
    ) {}

    /**
     * Check if a specific user is restricted from using a feature.
     */
    public function isRestricted(User|int $user, string $featureKey, ?int $estateId = null): bool
    {
        $userId = $user instanceof User ? $user->id : $user;

        // Never restrict protected features like visitor passes
        if (in_array($featureKey, $this->protectedFeatures, true)) {
            return false;
        }

        $query = Restriction::query()
            ->where('user_id', $userId)
            ->where('feature_key', $featureKey)
            ->where('status', 'active');

        if ($estateId) {
            $query->where('estate_id', $estateId);
        }

        return $query->exists();
    }

    /**
     * Impose a feature restriction for a violation.
     */
    public function imposeRestriction(Violation $violation, string $featureKey): ?Restriction
    {
        // Explicitly guard against restricting visitor passes
        if (in_array($featureKey, $this->protectedFeatures, true)) {
            return null;
        }

        $existing = Restriction::query()
            ->where('violation_id', $violation->id)
            ->where('feature_key', $featureKey)
            ->whereIn('status', ['active', 'suspended_by_payment_plan'])
            ->first();

        if ($existing) {
            if ($existing->status === 'suspended_by_payment_plan') {
                $existing->update(['status' => 'active']);
            }
            return $existing;
        }

        $restriction = Restriction::create([
            'violation_id' => $violation->id,
            'user_id' => $violation->user_id,
            'estate_id' => $violation->estate_id,
            'feature_key' => $featureKey,
            'status' => 'active',
            'restricted_at' => now(),
        ]);

        $violation->update(['status' => 'under_restriction']);

        $this->timelineRecorder->record(
            $violation,
            'restriction_imposed',
            'Service Restriction Applied',
            "Access to {$featureKey} was restricted due to policy violation.",
            ['feature_key' => $featureKey, 'restriction_id' => $restriction->id]
        );

        return $restriction;
    }

    /**
     * Lift all restrictions associated with a violation.
     */
    public function liftRestrictionsForViolation(Violation $violation, string $reason): int
    {
        $restrictions = Restriction::query()
            ->where('violation_id', $violation->id)
            ->whereIn('status', ['active', 'suspended_by_payment_plan'])
            ->get();

        $count = 0;
        foreach ($restrictions as $restriction) {
            $restriction->update([
                'status' => 'lifted',
                'lifted_at' => now(),
                'lift_reason' => $reason,
            ]);

            $this->timelineRecorder->record(
                $violation,
                'restriction_lifted',
                'Service Restriction Lifted',
                "Restriction on {$restriction->feature_key} was lifted ({$reason}).",
                ['feature_key' => $restriction->feature_key, 'restriction_id' => $restriction->id]
            );

            $count++;
        }

        return $count;
    }

    /**
     * Suspend restrictions temporarily when a payment plan is approved.
     */
    public function suspendRestrictionsForPaymentPlan(Violation $violation): int
    {
        $restrictions = Restriction::query()
            ->where('violation_id', $violation->id)
            ->where('status', 'active')
            ->get();

        $count = 0;
        foreach ($restrictions as $restriction) {
            $restriction->update([
                'status' => 'suspended_by_payment_plan',
            ]);

            $this->timelineRecorder->record(
                $violation,
                'restriction_suspended',
                'Restriction Suspended (Payment Plan)',
                "Restriction on {$restriction->feature_key} suspended under active payment plan.",
                ['feature_key' => $restriction->feature_key]
            );

            $count++;
        }

        return $count;
    }
}
