<?php

namespace App\Console\Commands;

use App\Jobs\Billing\ProcessSubscriptionReminderJob;
use App\Mail\CommandExecutedMail;
use App\Models\ResidentSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

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

        // 1. Trials that have ended
        ResidentSubscription::query()
            ->where('status', 'trial')
            ->where('current_period_end', '<', now())
            ->chunkById(500, function ($subscriptions) {
                foreach ($subscriptions as $subscription) {
                    $subscription->update(['status' => 'past_due']);
                }
            });

        // 2. Active subscriptions past grace period
        ResidentSubscription::query()
            ->where('status', 'active')
            ->where('current_period_end', '<', now())
            ->chunkById(500, function ($subscriptions) {
                foreach ($subscriptions as $subscription) {
                    $subscription->update(['status' => 'past_due']);
                }
            });

        // 3. QUEUED REMINDERS: Fetch only those needing reminders (O(actionable) instead of O(N))
        $this->dispatchReminders();

        $this->info('Check completed.');

        try {
            Mail::to('support@usekontrol.com')->queue(new CommandExecutedMail(
                'Command Executed: kontrol:check-resident-subscriptions',
                "Command 'kontrol:check-resident-subscriptions' executed successfully at ".now()->toDateTimeString()
            ));
        } catch (\Throwable $e) {
            $this->error('Failed to send mail: '.$e->getMessage());
        }
    }

    protected function dispatchReminders(): void
    {
        $now = now();
        $reminderThreshold = $now->copy()->addDays(3);

        // Fetch Resident Subscriptions needing reminders
        // 1. Trials ending within 3 days
        ResidentSubscription::query()
            ->where('status', 'trial')
            ->whereBetween('current_period_end', [$now, $reminderThreshold])
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
