<?php

namespace App\Console\Commands;

use App\Jobs\Billing\ProcessSubscriptionReminderJob;
use App\Models\ResidentSubscription;
use Illuminate\Console\Command;

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
        $this->info('Starting optimized resident subscription check...');

        // 1. BULK UPDATE: Trials that have ended
        $trialExpiredCount = ResidentSubscription::query()
            ->where('status', 'trial')
            ->where('trial_ends_at', '<', now())
            ->update(['status' => 'past_due']);

        if ($trialExpiredCount > 0) {
            $this->warn("Marked {$trialExpiredCount} expired trials as past_due.");
        }

        // 2. BULK UPDATE: Active subscriptions past grace period
        $graceThreshold = now();
        $activeExpiredCount = ResidentSubscription::query()
            ->where('status', 'active')
            ->where('current_period_end', '<', $graceThreshold)
            ->update(['status' => 'past_due']);

        if ($activeExpiredCount > 0) {
            $this->warn("Marked {$activeExpiredCount} expired active subscriptions as past_due.");
        }

        // 3. QUEUED REMINDERS: Fetch only those needing reminders (O(actionable) instead of O(N))
        $this->dispatchReminders();

        $this->info('Check completed.');
    }

    protected function dispatchReminders(): void
    {
        $now = now();
        $reminderThreshold = $now->copy()->addDays(3);

        // Fetch Resident Subscriptions needing reminders
        // 1. Trials ending within 3 days
        ResidentSubscription::query()
            ->where('status', 'trial')
            ->whereBetween('trial_ends_at', [$now, $reminderThreshold])
            ->where(function ($q) {
                $q->whereNull('last_reminded_at')
                    ->orWhere('last_reminded_at', '<', now()->subHours(24));
            })
            ->chunkById(1000, function ($subscriptions) {
                foreach ($subscriptions as $subscription) {
                    ProcessSubscriptionReminderJob::dispatch($subscription->id, 'trial_ending');
                }
            });

        // 2. Active subscriptions expiring within 3 days
        ResidentSubscription::query()
            ->where('status', 'active')
            ->whereBetween('current_period_end', [$now, $reminderThreshold])
            ->where(function ($q) {
                $q->whereNull('last_reminded_at')
                    ->orWhere('last_reminded_at', '<', now()->subHours(24));
            })
            ->chunkById(1000, function ($subscriptions) {
                foreach ($subscriptions as $subscription) {
                    ProcessSubscriptionReminderJob::dispatch($subscription->id, 'subscription_expiring');
                }
            });
    }
}
