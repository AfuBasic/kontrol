<?php

namespace App\Services\Compliance;

use App\Models\Compliance\Violation;
use App\Models\Compliance\ViolationTimeline;
use Illuminate\Support\Facades\Auth;

class TimelineRecorder
{
    /**
     * Record an immutable event in the violation timeline.
     */
    public function record(
        Violation $violation,
        string $eventType,
        string $title,
        ?string $description = null,
        ?array $metadata = null,
        ?string $actorType = null,
        ?int $actorId = null
    ): ViolationTimeline {
        if (! $actorType && Auth::check()) {
            $actorType = 'user';
            $actorId = Auth::id();
        } elseif (! $actorType) {
            $actorType = 'system';
        }

        return $violation->timeline()->create([
            'event_type' => $eventType,
            'title' => $title,
            'description' => $description,
            'metadata' => $metadata,
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'created_at' => now(),
        ]);
    }
}
