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

class SendCollectionRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $now = now()->startOfDay();

        // Find all unpaid assignments on active collections
        $assignments = CollectionAssignment::query()
            ->whereIn('status', ['pending', 'grace', 'overdue', 'partial'])
            ->whereHas('collection', fn ($q) => $q->where('status', 'active'))
            ->with(['user', 'collection', 'estate'])
            ->get();

        $count = 0;

        foreach ($assignments as $assignment) {
            if (! $assignment->due_date) {
                continue;
            }

            $dueDate = $assignment->due_date->startOfDay();
            $daysDiff = (int) $now->diffInDays($dueDate, false);

            $shouldNotify = false;

            // 1. Due in exactly 3 days (pre-due reminder)
            if ($daysDiff === 3) {
                $shouldNotify = true;
            }
            // 2. Due today
            elseif ($daysDiff === 0) {
                $shouldNotify = true;
            }
            // 3. Overdue by a multiple of 3 days (e.g. 3, 6, 9 days overdue)
            elseif ($daysDiff < 0 && abs($daysDiff) % 3 === 0) {
                $shouldNotify = true;
            }

            if ($shouldNotify) {
                $assignment->user->notify(new CollectionReminderNotification($assignment));
                $count++;
            }
        }

        Log::info("SendCollectionRemindersJob: sent {$count} reminders.");
    }
}
