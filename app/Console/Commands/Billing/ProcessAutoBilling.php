<?php

namespace App\Console\Commands\Billing;

use App\Jobs\Billing\ChargeInvoiceJob;
use App\Models\Invoice;
use App\Models\ResidentSubscription;
use Illuminate\Console\Command;

class ProcessAutoBilling extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:process-auto-billing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatches auto-billing jobs for all pending/overdue invoices with stored cards';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Starting auto-billing dispatcher...');

        // 1. Process Resident Invoices
        $this->processResidentInvoices();

        // 2. Process Estate Invoices
        $this->processEstateInvoices();

        $this->info('Dispatcher finished.');
    }

    private function processResidentInvoices(): void
    {
        // Find residents who have auto-billing enabled and a stored card
        $eligibleResidentIds = ResidentSubscription::query()
            ->where('billing_preference', 'auto')
            ->whereNotNull('paystack_authorization_code')
            ->pluck('user_id');

        if ($eligibleResidentIds->isEmpty()) {
            $this->line('No eligible residents found for auto-billing.');
            return;
        }

        // Find pending/overdue invoices for these residents
        Invoice::query()
            ->whereIn('user_id', $eligibleResidentIds)
            ->whereIn('status', ['pending', 'overdue'])
            ->chunkById(500, function ($invoices) {
                foreach ($invoices as $invoice) {
                    // Safety check: skip if recently attempted (within 23 hours)
                    $lastAttempt = $invoice->metadata['last_attempt_at'] ?? null;
                    if ($lastAttempt && now()->parse($lastAttempt)->greaterThan(now()->subHours(23))) {
                        continue;
                    }

                    ChargeInvoiceJob::dispatch($invoice->id);
                    $this->line("Dispatched auto-charge for resident invoice #{$invoice->id}");
                }
            });
    }

    private function processEstateInvoices(): void
    {
        // Find estates with auto-billing and stored cards
        Invoice::query()
            ->whereNull('user_id')
            ->whereIn('status', ['pending', 'overdue'])
            ->whereHas('estate.subscriptionRecord', function ($q) {
                $q->where('billing_preference', 'auto')
                  ->whereNotNull('paystack_authorization_code');
            })
            ->chunkById(100, function ($invoices) {
                foreach ($invoices as $invoice) {
                    // Safety check: skip if recently attempted
                    $lastAttempt = $invoice->metadata['last_attempt_at'] ?? null;
                    if ($lastAttempt && now()->parse($lastAttempt)->greaterThan(now()->subHours(23))) {
                        continue;
                    }

                    ChargeInvoiceJob::dispatch($invoice->id);
                    $this->line("Dispatched auto-charge for estate invoice #{$invoice->id}");
                }
            });
    }
}
