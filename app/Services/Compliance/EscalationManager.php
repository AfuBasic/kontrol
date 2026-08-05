<?php

namespace App\Services\Compliance;

use App\Models\Compliance\PolicyAction;
use App\Models\Compliance\Violation;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class EscalationManager
{
    public function __construct(
        protected TimelineRecorder $timelineRecorder
    ) {}

    /**
     * Handle administrative escalation for a violation.
     */
    public function escalate(Violation $violation, PolicyAction $action): void
    {
        $config = $action->configuration ?? [];

        $violation->update([
            'status' => 'escalated',
        ]);

        $this->timelineRecorder->record(
            $violation,
            'escalated',
            'Violation Escalated',
            $config['notes'] ?? 'Violation escalated to estate management for administrative review.',
            $config
        );

        Log::notice("Compliance Violation #{$violation->id} escalated for user #{$violation->user_id} in estate #{$violation->estate_id}");
    }

    /**
     * Assign a compliance/collections officer to handle the violation.
     */
    public function assignOfficer(Violation $violation, User|int $officer): void
    {
        $officerId = $officer instanceof User ? $officer->id : $officer;

        $this->timelineRecorder->record(
            $violation,
            'officer_assigned',
            'Compliance Officer Assigned',
            "Assigned to compliance officer #{$officerId}.",
            ['officer_id' => $officerId]
        );
    }
}
