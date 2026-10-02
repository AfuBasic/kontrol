<?php

namespace App\Jobs\Billing;

use App\Models\ResidentSubscription;
use App\Notifications\ResidentSubscriptionExpiringNotification;
use App\Notifications\ResidentTrialEndingNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessSubscriptionReminderJob implements ShouldQueue
{
    use Queueable;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 1;

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $subscriptionId,
        public string $type // 'trial_ending' or 'subscription_expiring'
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $subscription = ResidentSubscription::with('user')->find($this->subscriptionId);

        if (! $subscription || ! $subscription->user) {
            return;
        }

        // Prevent spam: only remind once every 24 hours
        if ($subscription->last_reminded_at && $subscription->last_reminded_at->greaterThan(now()->subHours(24))) {
            return;
        }

        $notification = match ($this->type) {
            'trial_ending' => new ResidentTrialEndingNotification($subscription),
            'subscription_expiring' => new ResidentSubscriptionExpiringNotification($subscription),
            default => null,
        };

        if ($notification) {
            $subscription->user->notify($notification);
            $subscription->update(['last_reminded_at' => now()]);
        }
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
