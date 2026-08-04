<?php

namespace App\Jobs\Admin;

use App\Models\CollectionAssignment;
use App\Services\Compliance\ComplianceEngine;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendCollectionRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ComplianceEngine $engine): void
    {
        // Find all unpaid assignments on active collections
        $assignments = CollectionAssignment::query()
            ->whereIn('status', ['pending', 'grace', 'overdue', 'partial'])
            ->whereHas('collection', fn ($q) => $q->where('status', 'active'))
            ->get();

        $count = 0;

        foreach ($assignments as $assignment) {
            if ($assignment->isComplianceResolved()) {
                $engine->resolveCompliance($assignment, 'Collection Paid');

                continue;
            }

            // Raise / sync violation in ComplianceEngine
            $engine->raiseViolation($assignment);
            $count++;
        }

        // Run platform-wide policy evaluation for all active open violations
        $evaluatedCount = $engine->evaluateAllOpenViolations();

        Log::info("SendCollectionRemindersJob (ComplianceEngine): synced {$count} assignments, evaluated {$evaluatedCount} violations.");
    }
}
