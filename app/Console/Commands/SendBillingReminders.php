<?php

namespace App\Console\Commands;

use App\Mail\Admin\BillingReminderMail;
use App\Models\EstateSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendBillingReminders extends Command
{
    protected $signature = 'kontrol:send-billing-reminders';

    protected $description = 'Send billing reminders for invoices due in 7 days';

    public function handle(): int
    {
        // Find subscriptions where next billing is in 7 days, not yet notified
        $sevenDaysFromNow = now()->addDays(7)->toDateString();

        $subscriptions = EstateSubscription::whereDate('next_billing_date', $sevenDaysFromNow)
            ->with('estate.settings', 'plan')
            ->get()
            ->filter(function ($subscription) {
                return $subscription->estate->settings->charge_type === 'estate';
            });

        $count = $subscriptions->count();
        $this->info("Sending {$count} billing reminders");

        foreach ($subscriptions as $subscription) {
            $estate = $subscription->estate;
            $admins = $estate->users()->where('user_type', 'admin')->get();

            foreach ($admins as $admin) {
                Mail::to($admin->email)->send(new BillingReminderMail($subscription));
            }

            $this->line("Sent reminder for estate {$estate->id}");
        }

        return Command::SUCCESS;
    }
}
