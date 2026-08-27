<?php

namespace App\Console\Commands\Billing;

use App\Models\ResidentSubscription;
use App\Notifications\Resident\AutoRenewAdoptionNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendAutoRenewAdoptionReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:send-auto-renew-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sends a gentle one-time auto-renew adoption reminder to eligible residents with saved cards';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Evaluating eligible resident subscriptions for auto-renew adoption reminders...');

        // Eligible criteria:
        // 1. Active subscription
        // 2. auto_renew_enabled is false
        // 3. auto_renew_opted_out is false
        // 4. Stored card authorization exists
        // 5. Subscription is active and period end is in the future
        // 6. Last payment occurred at least 3 days ago (adoption period)
        // 7. Deduplication: no AutoRenewAdoptionNotification sent during the current billing period

        $subscriptions = ResidentSubscription::query()
            ->where('status', 'active')
            ->where('auto_renew_enabled', false)
            ->where('auto_renew_opted_out', false)
            ->whereNotNull('paystack_authorization_code')
            ->where('current_period_end', '>', now())
            ->where('last_paid_at', '<=', now()->subDays(3))
            ->with(['user', 'estate.settings'])
            ->get()
            ->filter(function (ResidentSubscription $subscription) {
                // Ensure estate charge type is residents (or supports resident subscription)
                if ($subscription->estate && ($subscription->estate->settings->charge_type ?? '') !== 'residents') {
                    return false;
                }

                if (! $subscription->user) {
                    return false;
                }

                // Check deduplication in notifications table for current billing period
                $periodStart = $subscription->current_period_start ?: $subscription->created_at;

                $alreadySent = DB::table('notifications')
                    ->where('notifiable_type', get_class($subscription->user))
                    ->where('notifiable_id', $subscription->user->id)
                    ->where('type', AutoRenewAdoptionNotification::class)
                    ->where('created_at', '>=', $periodStart)
                    ->exists();

                return ! $alreadySent;
            });

        $count = 0;
        foreach ($subscriptions as $subscription) {
            $subscription->user->notify(new AutoRenewAdoptionNotification($subscription));
            $count++;
        }

        $this->info("Sent {$count} auto-renew adoption reminders.");

        return Command::SUCCESS;
    }
}
