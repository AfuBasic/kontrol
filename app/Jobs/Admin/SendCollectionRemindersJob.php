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

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 1;

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 600;

    public function handle(?ComplianceEngine $engine = null): void
    {
        $engine = $engine ?? app(ComplianceEngine::class);
        // Find all unpaid assignments on active estate-level collections (excluding Property Owner collections)
        $assignments = CollectionAssignment::query()
            ->whereIn('status', ['pending', 'grace', 'overdue', 'partial'])
            ->whereHas('collection', function ($q) {
                $q->where('status', 'active')
                    ->whereDoesntHave('creator.roles', function ($sq) {
                        $sq->where('name', 'property_owner');
                    });
            })
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

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
