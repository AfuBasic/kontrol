<?php

namespace App\Services\Compliance;

use App\Models\Compliance\Violation;
use App\Services\Compliance\Contracts\ViolatableInterface;

class ResolutionManager
{
    public function __construct(
        protected RestrictionManager $restrictionManager,
        protected TimelineRecorder $timelineRecorder
    ) {}

    /**
     * Resolve a violation when compliance is restored.
     */
    public function resolve(Violation $violation, string $reason = 'Payment Received / Full Compliance Restored'): void
    {
        if ($violation->status === 'resolved') {
            return;
        }

        // Lift all active restrictions
        $this->restrictionManager->liftRestrictionsForViolation($violation, $reason);

        // Update violation status
        $violation->update([
            'status' => 'resolved',
            'outstanding_amount' => 0,
            'resolved_at' => now(),
            'resolution_reason' => $reason,
        ]);

        // Complete any active payment plan
        if ($violation->paymentPlan) {
            $violation->paymentPlan->update(['status' => 'completed']);
        }

        // Record resolution in immutable timeline
        $this->timelineRecorder->record(
            $violation,
            'resolved',
            'Compliance Restored',
            "Violation resolved: {$reason}. All active restrictions lifted.",
            ['resolution_reason' => $reason]
        );
    }

    /**
     * Resolve violation associated with a specific violatable entity.
     */
    public function resolveForViolatable(ViolatableInterface $violatable, string $reason = 'Compliance Restored'): void
    {
        $violation = Violation::query()
            ->where('violatable_type', get_class($violatable))
            ->where('violatable_id', $violatable->getComplianceUserId()) // fallback or ID check
            ->whereIn('status', ['open', 'under_restriction', 'escalated', 'on_payment_plan'])
            ->first();

        if ($violation) {
            $this->resolve($violation, $reason);
        }
    }
}
