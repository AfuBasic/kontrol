<?php

namespace App\Services\Compliance;

use App\Models\Compliance\Violation;
use App\Models\User;
use App\Services\Compliance\Contracts\ViolatableInterface;
use Illuminate\Database\Eloquent\Model;

class ComplianceEngine
{
    public function __construct(
        public ViolationManager $violations,
        public PolicyEvaluator $evaluator,
        public RestrictionManager $restrictions,
        public PenaltyManager $penalties,
        public EscalationManager $escalation,
        public ResolutionManager $resolution,
        public TimelineRecorder $timeline
    ) {}

    /**
     * Raise a compliance violation for a domain model.
     */
    public function raiseViolation(ViolatableInterface&Model $violatable): Violation
    {
        return $this->violations->createViolation($violatable);
    }

    /**
     * Resolve compliance for a domain model when paid/satisfied.
     */
    public function resolveCompliance(ViolatableInterface $violatable, string $reason = 'Compliance Restored'): void
    {
        $this->resolution->resolveForViolatable($violatable, $reason);
    }

    /**
     * Check if user is restricted from using a service/feature.
     */
    public function isRestricted(User|int $user, string $featureKey, ?int $estateId = null): bool
    {
        return $this->restrictions->isRestricted($user, $featureKey, $estateId);
    }

    /**
     * Evaluate all open violations in an estate or platform-wide.
     */
    public function evaluateAllOpenViolations(?int $estateId = null): int
    {
        $query = Violation::query()
            ->whereIn('status', ['open', 'under_restriction', 'escalated', 'on_payment_plan']);

        if ($estateId) {
            $query->where('estate_id', $estateId);
        }

        $count = 0;
        $query->chunk(100, function ($violations) use (&$count) {
            foreach ($violations as $violation) {
                $this->evaluator->evaluate($violation);
                $count++;
            }
        });

        return $count;
    }
}
