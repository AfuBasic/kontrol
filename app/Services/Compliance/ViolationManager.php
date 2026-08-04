<?php

namespace App\Services\Compliance;

use App\Models\Compliance\CompliancePolicy;
use App\Models\Compliance\PaymentPlan;
use App\Models\Compliance\PolicyStage;
use App\Models\Compliance\Violation;
use App\Models\User;
use App\Services\Compliance\Contracts\ViolatableInterface;
use Illuminate\Database\Eloquent\Model;

class ViolationManager
{
    public function __construct(
        protected PolicyEvaluator $policyEvaluator,
        protected RestrictionManager $restrictionManager,
        protected ResolutionManager $resolutionManager,
        protected TimelineRecorder $timelineRecorder
    ) {}

    /**
     * Create or retrieve a violation for a violatable entity.
     */
    public function createViolation(ViolatableInterface&Model $violatable): Violation
    {
        $existing = Violation::query()
            ->where('violatable_type', get_class($violatable))
            ->where('violatable_id', $violatable->getKey())
            ->whereIn('status', ['open', 'under_restriction', 'escalated', 'on_payment_plan'])
            ->first();

        if ($existing) {
            // Sync balances
            $existing->update([
                'outstanding_amount' => $violatable->getComplianceOutstandingAmount(),
                'due_at' => $violatable->getComplianceDueAt(),
            ]);

            return $existing;
        }

        $violationType = $violatable->getComplianceViolationType();
        $estateId = $violatable->getComplianceEstateId();

        // Find applicable policy for estate or default
        $policy = CompliancePolicy::query()
            ->where('estate_id', $estateId)
            ->where('violation_type', $violationType)
            ->where('is_active', true)
            ->first() ?? CompliancePolicy::query()
            ->whereNull('estate_id')
            ->where('violation_type', $violationType)
            ->where('is_active', true)
            ->first();

        // Create initial default policy if none exists
        if (! $policy) {
            $policy = $this->createDefaultPolicy($estateId, $violationType);
        }

        $firstStage = $policy->stages->first();

        $violation = Violation::create([
            'estate_id' => $estateId,
            'user_id' => $violatable->getComplianceUserId(),
            'property_id' => $violatable->getCompliancePropertyId(),
            'compliance_policy_id' => $policy->id,
            'current_stage_id' => $firstStage?->id,
            'violatable_type' => get_class($violatable),
            'violatable_id' => $violatable->getKey(),
            'violation_type' => $violationType,
            'status' => 'open',
            'due_at' => $violatable->getComplianceDueAt(),
            'original_amount' => $violatable->getComplianceOriginalAmount(),
            'outstanding_amount' => $violatable->getComplianceOutstandingAmount(),
            'total_penalties_applied' => 0,
        ]);

        $this->timelineRecorder->record(
            $violation,
            'violation_created',
            'Compliance Violation Opened',
            "Violation of type '{$violationType}' opened for tracking.",
            ['policy_id' => $policy->id, 'due_at' => $violation->due_at?->toIso8601String()]
        );

        // Immediate initial evaluation
        $this->policyEvaluator->evaluate($violation);

        return $violation;
    }

    /**
     * Create a payment plan for a resident.
     */
    public function approvePaymentPlan(
        Violation $violation,
        float $installmentAmount,
        string $frequency,
        string $startDate,
        User|int $approvedBy,
        ?array $terms = null
    ): PaymentPlan {
        $approvedById = $approvedBy instanceof User ? $approvedBy->id : $approvedBy;

        $plan = PaymentPlan::create([
            'violation_id' => $violation->id,
            'approved_by_user_id' => $approvedById,
            'status' => 'active',
            'installment_amount' => $installmentAmount,
            'frequency' => $frequency,
            'start_date' => $startDate,
            'next_due_date' => $startDate,
            'terms' => $terms,
        ]);

        $violation->update(['status' => 'on_payment_plan']);

        $policyRules = $violation->policy?->payment_plan_policy ?? [];
        if (! empty($policyRules['suspend_restrictions'])) {
            $this->restrictionManager->suspendRestrictionsForPaymentPlan($violation);
        }

        $this->timelineRecorder->record(
            $violation,
            'payment_plan_created',
            'Payment Plan Approved',
            'Approved payment plan of '.number_format($installmentAmount, 2)." ({$frequency}).",
            ['plan_id' => $plan->id, 'approved_by' => $approvedById]
        );

        return $plan;
    }

    /**
     * Create default baseline policy for an estate / platform.
     */
    protected function createDefaultPolicy(int $estateId, string $violationType): CompliancePolicy
    {
        $policy = CompliancePolicy::create([
            'estate_id' => $estateId,
            'violation_type' => $violationType,
            'name' => 'Standard Collection Enforcement Policy',
            'description' => 'Gradual enforcement lifecycle for overdue collections.',
            'is_active' => true,
            'payment_plan_policy' => [
                'pause_penalties' => true,
                'suspend_restrictions' => true,
                'suspend_escalation' => true,
            ],
        ]);

        // Stage 1: Reminder (Day 0)
        $s1 = PolicyStage::create([
            'compliance_policy_id' => $policy->id,
            'stage_name' => 'Reminder',
            'trigger_days' => 0,
            'order' => 1,
        ]);
        $s1->actions()->create([
            'action_type' => 'notification',
            'configuration' => ['title' => 'Friendly Payment Reminder', 'message' => 'Your collection payment is due soon.'],
        ]);

        // Stage 2: Warning (Day 7)
        $s2 = PolicyStage::create([
            'compliance_policy_id' => $policy->id,
            'stage_name' => 'Overdue Warning',
            'trigger_days' => 7,
            'order' => 2,
        ]);
        $s2->actions()->create([
            'action_type' => 'notification',
            'configuration' => ['title' => 'Payment Overdue Warning', 'message' => 'Your payment is 7 days past due.'],
        ]);

        // Stage 3: Penalty (Day 14)
        $s3 = PolicyStage::create([
            'compliance_policy_id' => $policy->id,
            'stage_name' => 'Penalty',
            'trigger_days' => 14,
            'order' => 3,
        ]);
        $s3->actions()->create([
            'action_type' => 'penalty',
            'configuration' => ['penalty_type' => 'percentage', 'value' => 5], // 5% late fee
        ]);

        // Stage 4: Service Restriction (Day 21)
        $s4 = PolicyStage::create([
            'compliance_policy_id' => $policy->id,
            'stage_name' => 'Service Restriction',
            'trigger_days' => 21,
            'order' => 4,
        ]);
        $s4->actions()->create([
            'action_type' => 'restriction',
            'configuration' => ['feature_key' => 'amenity.book'], // Amenity booking restricted (visitor pass protected)
        ]);

        // Stage 5: Escalation (Day 30)
        $s5 = PolicyStage::create([
            'compliance_policy_id' => $policy->id,
            'stage_name' => 'Escalation',
            'trigger_days' => 30,
            'order' => 5,
        ]);
        $s5->actions()->create([
            'action_type' => 'escalation',
            'configuration' => ['notes' => 'Escalated to Estate Manager for manual review.'],
        ]);

        return $policy;
    }
}
