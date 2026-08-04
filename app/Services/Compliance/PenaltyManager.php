<?php

namespace App\Services\Compliance;

use App\Models\Compliance\PenaltyRecord;
use App\Models\Compliance\PolicyAction;
use App\Models\Compliance\Violation;

class PenaltyManager
{
    public function __construct(
        protected TimelineRecorder $timelineRecorder
    ) {}

    /**
     * Calculate and apply a penalty based on action configuration.
     * Supported strategies: fixed, percentage, daily_interest, weekly_interest, monthly_interest.
     */
    public function applyPenalty(Violation $violation, PolicyAction $action): ?PenaltyRecord
    {
        $config = $action->configuration ?? [];
        $type = $config['penalty_type'] ?? 'fixed'; // fixed, percentage, daily_interest, weekly_interest, monthly_interest
        $value = (float) ($config['value'] ?? 0);
        $cap = isset($config['cap']) ? (float) $config['cap'] : null;

        if ($value <= 0) {
            return null;
        }

        // Calculate penalty amount
        $amount = 0.0;
        $base = (float) $violation->outstanding_amount;

        switch ($type) {
            case 'fixed':
                $amount = $value;
                break;
            case 'percentage':
                $amount = round(($base * ($value / 100)), 2);
                break;
            case 'daily_interest':
            case 'weekly_interest':
            case 'monthly_interest':
                $amount = round(($base * ($value / 100)), 2);
                break;
        }

        if ($cap !== null && $amount > $cap) {
            $amount = $cap;
        }

        if ($amount <= 0) {
            return null;
        }

        // Create penalty record
        $record = PenaltyRecord::create([
            'violation_id' => $violation->id,
            'policy_action_id' => $action->id,
            'penalty_type' => $type,
            'amount' => $amount,
            'calculation_details' => [
                'type' => $type,
                'rate_or_value' => $value,
                'base_outstanding' => $base,
                'cap' => $cap,
            ],
            'applied_at' => now(),
        ]);

        // Update violation balances
        $violation->total_penalties_applied = (float) $violation->total_penalties_applied + $amount;
        $violation->outstanding_amount = (float) $violation->outstanding_amount + $amount;
        $violation->save();

        // Sync back to violatable if supported
        if ($violation->violatable && method_exists($violation->violatable, 'syncCompliancePenalty')) {
            $violation->violatable->syncCompliancePenalty((float) $violation->total_penalties_applied);
        }

        $this->timelineRecorder->record(
            $violation,
            'penalty_applied',
            'Financial Penalty Applied',
            "A {$type} penalty of ".number_format($amount, 2)." was applied.",
            ['amount' => $amount, 'penalty_type' => $type, 'record_id' => $record->id]
        );

        return $record;
    }
}
