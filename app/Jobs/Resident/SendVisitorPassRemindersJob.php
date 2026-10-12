<?php

namespace App\Jobs\Resident;

use App\Enums\AccessCodeStatus;
use App\Models\VisitorPassReminder;
use App\Notifications\Resident\VisitorPassReminderNotification;
use App\Services\Resident\VisitorPassReminderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendVisitorPassRemindersJob implements ShouldQueue
{
    use Queueable;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 1;

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 120;

    /**
     * Execute the job.
     */
    public function handle(VisitorPassReminderService $reminderService): void
    {
        $startedAt = hrtime(true);
        $dueReminders = $reminderService->claimDueReminders(50);

        // Most minutes have nothing due, so say nothing then.
        if ($dueReminders->isEmpty()) {
            return;
        }

        $outcomes = ['sent' => 0, 'cancelled' => 0, 'failed' => 0];

        foreach ($dueReminders as $reminder) {
            $outcomes[$this->processReminder($reminder)]++;
        }

        // Job History records how long a run took but not how much work it did; this line says what a slow run was doing.
        Log::info('Visitor pass reminders processed', [
            'claimed' => $dueReminders->count(),
            ...$outcomes,
            'duration_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
        ]);
    }

    /**
     * @return 'sent'|'cancelled'|'failed'
     */
    private function processReminder(VisitorPassReminder $reminder): string
    {
        $accessCode = $reminder->accessCode;
        $user = $reminder->user;

        // Verify pass state: must be active/scheduled, not revoked, not used, not expired
        if (! $accessCode || ! $user) {
            $reminder->cancel();

            return 'cancelled';
        }

        if (! in_array($accessCode->status, [AccessCodeStatus::Active, AccessCodeStatus::Scheduled], true)) {
            $reminder->cancel();

            return 'cancelled';
        }

        if ($accessCode->revoked_at !== null || $accessCode->used_at !== null || $accessCode->isExpired()) {
            $reminder->cancel();

            return 'cancelled';
        }

        // Verify that the pass validity start has not already arrived/passed
        if ($accessCode->starts_at && $accessCode->starts_at->isPast()) {
            $reminder->cancel();

            return 'cancelled';
        }

        try {
            $user->notify(new VisitorPassReminderNotification($reminder, $accessCode));
            $reminder->markAsSent();

            return 'sent';
        } catch (Throwable $e) {
            Log::error('Failed to dispatch visitor pass reminder notification', [
                'reminder_id' => $reminder->id,
                'access_code_id' => $accessCode->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            $reminder->markAsFailed();

            return 'failed';
        }
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
