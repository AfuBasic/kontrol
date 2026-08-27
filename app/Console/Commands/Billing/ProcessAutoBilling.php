<?php

namespace App\Console\Commands\Billing;

use App\Services\Billing\RecurringBillingService;
use Illuminate\Console\Command;

class ProcessAutoBilling extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:process-auto-billing {--force : Force processing even if recently attempted}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Processes automated recurring charges for due estate and resident subscriptions with stored cards';

    /**
     * Execute the console command.
     */
    public function handle(RecurringBillingService $recurringBillingService): void
    {
        $this->info('Starting recurring auto-billing run...');

        $recurringBillingService->processDueSubscriptions();

        $this->info('Recurring auto-billing run completed.');
    }
}
