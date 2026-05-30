<?php

namespace App\Jobs\Admin;

use App\Models\CollectionAssignment;
use App\Notifications\Resident\CollectionReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class WeeklyCollectionReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Find all unpaid assignments on active collections
        $assignments = CollectionAssignment::query()
            ->whereIn('status', ['pending', 'grace', 'overdue', 'partial'])
            ->whereHas('collection', fn ($q) => $q->where('status', 'active'))
            ->with(['user', 'collection', 'estate'])
            ->get();

        $count = 0;

        foreach ($assignments as $assignment) {
            $assignment->user->notify(new CollectionReminderNotification($assignment));
            $count++;
        }

        Log::info("WeeklyCollectionReminderJob: sent {$count} reminders.");
    }
}
