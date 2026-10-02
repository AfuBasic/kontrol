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
        $dueReminders = $reminderService->claimDueReminders(50);

        foreach ($dueReminders as $reminder) {
            $this->processReminder($reminder);
        }
    }

    private function processReminder(VisitorPassReminder $reminder): void
    {
        $accessCode = $reminder->accessCode;
        $user = $reminder->user;

        // Verify pass state: must be active/scheduled, not revoked, not used, not expired
        if (! $accessCode || ! $user) {
            $reminder->cancel();

            return;
        }

        if (! in_array($accessCode->status, [AccessCodeStatus::Active, AccessCodeStatus::Scheduled], true)) {
            $reminder->cancel();

            return;
        }

        if ($accessCode->revoked_at !== null || $accessCode->used_at !== null || $accessCode->isExpired()) {
            $reminder->cancel();

            return;
        }

        // Verify that the pass validity start has not already arrived/passed
        if ($accessCode->starts_at && $accessCode->starts_at->isPast()) {
            $reminder->cancel();

            return;
        }

        try {
            $user->notify(new VisitorPassReminderNotification($reminder, $accessCode));
            $reminder->markAsSent();
        } catch (Throwable $e) {
            Log::error('Failed to dispatch visitor pass reminder notification', [
                'reminder_id' => $reminder->id,
                'access_code_id' => $accessCode->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            $reminder->markAsFailed();
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
