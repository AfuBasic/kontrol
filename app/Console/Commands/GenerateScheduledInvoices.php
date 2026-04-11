<?php

namespace App\Console\Commands;

use App\Jobs\Billing\GenerateInvoiceJob;
use App\Models\EstateSubscription;
use Illuminate\Console\Command;

class GenerateScheduledInvoices extends Command
{
    protected $signature = 'app:generate-scheduled-invoices';

    protected $description = 'Generate invoices for estates with billing due today';

    public function handle(): int
    {
        // 1. Find subscriptions in trial that expired today
        $trialExpiredSubscriptions = EstateSubscription::where('status', 'trial')
            ->whereDate('trial_ends_at', '<=', today())
            ->with('estate.settings')
            ->get()
            ->filter(function ($subscription) {
                return $subscription->estate->settings->charge_type === 'estate';
            });

        $trialCount = $trialExpiredSubscriptions->count();
        if ($trialCount > 0) {
            $this->info("Found {$trialCount} trial expiration(s)");

            foreach ($trialExpiredSubscriptions as $subscription) {
                GenerateInvoiceJob::dispatch($subscription->estate_id, isFirstInvoice: true);
                $this->line("Dispatched first invoice generation (trial end) for estate {$subscription->estate_id}");
            }
        }

        // 2. Find active subscriptions with recurring invoices due today
        $dueSubscriptions = EstateSubscription::where('status', 'active')
            ->whereDate('next_billing_date', '<=', today())
            ->with('estate.settings')
            ->get()
            ->filter(function ($subscription) {
                return $subscription->estate->settings->charge_type === 'estate';
            });

        $recurringCount = $dueSubscriptions->count();
        if ($recurringCount > 0) {
            $this->info("Found {$recurringCount} recurring invoice(s)");

            foreach ($dueSubscriptions as $subscription) {
                GenerateInvoiceJob::dispatch($subscription->estate_id);
                $this->line("Dispatched recurring invoice generation for estate {$subscription->estate_id}");
            }
        }

        $this->info('Total invoices dispatched: '.($trialCount + $recurringCount));

        return Command::SUCCESS;
    }
}
