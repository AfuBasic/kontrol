<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use Illuminate\Console\Command;

class MarkOverdueInvoices extends Command
{
    protected $signature = 'app:mark-overdue-invoices';

    protected $description = 'Mark unpaid invoices past grace period as overdue';

    public function handle(): int
    {
        // Mark pending invoices past grace period (due_date + 5 days) as overdue
        $gracePeriodEnd = now()->subDays(5)->toDateString();

        $count = Invoice::where('status', 'pending')
            ->whereDate('due_date', '<=', $gracePeriodEnd)
            ->update(['status' => 'overdue']);

        $this->info("Marked {$count} invoices as overdue");

        return Command::SUCCESS;
    }
}
