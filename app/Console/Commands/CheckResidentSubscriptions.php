<?php

namespace App\Console\Commands;

use App\Models\ResidentSubscription;
use App\Notifications\ResidentSubscriptionExpiredNotification;
use App\Notifications\ResidentSubscriptionExpiringNotification;
use App\Notifications\ResidentTrialEndingNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckResidentSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:check-resident-subscriptions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks resident subscription statuses and sends reminders/updates states';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Starting resident subscription check...');

        ResidentSubscription::query()
            ->whereHas('estate.settings', function ($query) {
                $query->where('charge_type', 'residents');
            })
            ->chunk(100, function ($subscriptions) {
                foreach ($subscriptions as $subscription) {
                    $this->processSubscription($subscription);
                }
            });

        $this->info('Check completed.');
    }

    protected function processSubscription(ResidentSubscription $subscription): void
    {
        $now = now();
        $user = $subscription->user;

        // 1. Handle Trial Ending
        if ($subscription->status === 'trial' && $subscription->trial_ends_at) {
            if ($now->greaterThan($subscription->trial_ends_at)) {
                $this->markAsPastDue($subscription);

                return;
            }

            if ($subscription->trial_ends_at->diffInDays($now) <= 2) {
                $this->sendReminder($subscription, new ResidentTrialEndingNotification($subscription));
            }
        }

        // 2. Handle Active Subscription Expiring/Expired
        if ($subscription->status === 'active' && $subscription->current_period_end) {
            $graceEnd = $subscription->current_period_end->copy()->addDays(2);

            if ($now->greaterThan($graceEnd)) {
                $this->markAsPastDue($subscription);

                return;
            }

            if ($subscription->current_period_end->diffInDays($now) <= 3) {
                $this->sendReminder($subscription, new ResidentSubscriptionExpiringNotification($subscription));
            }
        }
    }

    protected function markAsPastDue(ResidentSubscription $subscription): void
    {
        $subscription->update(['status' => 'past_due']);
        $subscription->user->notify(new ResidentSubscriptionExpiredNotification($subscription));
        Log::info("Resident subscription #{$subscription->id} marked as past_due.");
    }

    protected function sendReminder(ResidentSubscription $subscription, mixed $notification): void
    {
        // Prevent spam: only remind once every 24 hours
        if ($subscription->last_reminded_at && $subscription->last_reminded_at->greaterThan(now()->subHours(24))) {
            return;
        }

        $subscription->user->notify($notification);
        $subscription->update(['last_reminded_at' => now()]);
    }
}
