<?php

namespace App\Console\Commands\Billing;

use App\Services\Billing\RecurringBillingService;
use Illuminate\Console\Command;

class ProcessRecurringPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'billing:process-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process due recurring payments for estates and residents via Paystack authorizations';

    /**
     * Execute the console command.
     */
    public function handle(RecurringBillingService $billingService): int
    {
        $this->info('Starting recurring billing process...');

        try {
            $billingService->processDueSubscriptions();
            $this->info('Recurring billing process completed successfully.');
        } catch (\Exception $e) {
            $this->error('Recurring billing process failed: '.$e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
