<?php

namespace App\Console\Commands\Billing;

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
    protected $description = 'Dispatches auto-billing jobs for all pending/overdue invoices with stored cards';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Auto-billing is disabled in the system.');
    }
}
