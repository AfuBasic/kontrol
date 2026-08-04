<?php

namespace App\Services\Compliance;

use App\Models\Compliance\PolicyAction;
use App\Models\Compliance\PolicyStage;
use App\Models\Compliance\Violation;
use Illuminate\Support\Carbon;

class PolicyEvaluator
{
    public function __construct(
        protected RestrictionManager $restrictionManager,
        protected PenaltyManager $penaltyManager,
        protected EscalationManager $escalationManager,
        protected TimelineRecorder $timelineRecorder
    ) {}

    /**
     * Evaluate a single violation against its policy stages and execute pending actions.
     */
    public function evaluate(Violation $violation): void
    {
        if (in_array($violation->status, ['resolved', 'dismissed'])) {
            return;
        }

        // Check active payment plan rules
        if ($violation->status === 'on_payment_plan' && $violation->activePaymentPlan) {
            $policy = $violation->policy;
            $planRules = $policy?->payment_plan_policy ?? [];

            // If payment plan pauses enforcement, exit early
            if (! empty($planRules['pause_penalties'])) {
                return;
            }
        }

        $policy = $violation->policy;
        if (! $policy || ! $policy->is_active) {
            return;
        }

        $now = now();
        $dueAt = $violation->due_at ? Carbon::parse($violation->due_at) : $violation->created_at;
        $daysDiff = max(0, (int) $dueAt->diffInDays($now, false)); // Days past due

        // Find applicable policy stage
        $stages = $policy->stages; // Ordered by order ASC
        $targetStage = null;

        foreach ($stages as $stage) {
            if ($daysDiff >= $stage->trigger_days) {
                $targetStage = $stage;
            }
        }

        if (! $targetStage) {
            return;
        }

        // Check stage progression
        $stageChanged = false;
        if ($violation->current_stage_id !== $targetStage->id) {
            $violation->current_stage_id = $targetStage->id;
            $violation->save();
            $stageChanged = true;

            $this->timelineRecorder->record(
                $violation,
                'stage_entered',
                "Entered Stage: {$targetStage->stage_name}",
                "Violation entered stage '{$targetStage->stage_name}' ({$daysDiff} days past due).",
                ['stage_id' => $targetStage->id, 'trigger_days' => $targetStage->trigger_days]
            );
        }

        // Execute stage actions
        $this->executeStageActions($violation, $targetStage, $stageChanged);
    }

    /**
     * Execute actions belonging to a policy stage.
     */
    protected function executeStageActions(Violation $violation, PolicyStage $stage, bool $stageChanged): void
    {
        $actions = $stage->actions()->where('is_enabled', true)->get();

        foreach ($actions as $action) {
            switch ($action->action_type) {
                case 'restriction':
                    $config = $action->configuration ?? [];
                    $featureKey = $config['feature_key'] ?? null;
                    if ($featureKey) {
                        $this->restrictionManager->imposeRestriction($violation, $featureKey);
                    }
                    break;

                case 'penalty':
                    // Apply penalty if stage just entered or daily/weekly recurring
                    if ($stageChanged || ($action->configuration['recurring'] ?? false)) {
                        $this->penaltyManager->applyPenalty($violation, $action);
                    }
                    break;

                case 'escalation':
                    if ($stageChanged) {
                        $this->escalationManager->escalate($violation, $action);
                    }
                    break;

                case 'notification':
                    if ($stageChanged) {
                        $this->sendNotification($violation, $action);
                    }
                    break;
            }
        }
    }

    protected function sendNotification(Violation $violation, PolicyAction $action): void
    {
        $config = $action->configuration ?? [];
        $title = $config['title'] ?? 'Compliance Notice';
        $message = $config['message'] ?? 'Please check your compliance dashboard.';

        $this->timelineRecorder->record(
            $violation,
            'notification_sent',
            $title,
            $message,
            ['action_id' => $action->id]
        );
    }
}
