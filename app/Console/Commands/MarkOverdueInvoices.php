<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use Illuminate\Console\Command;

class MarkOverdueInvoices extends Command
{
    protected $signature = 'kontrol:mark-overdue-invoices';

    protected $description = 'Mark unpaid invoices past grace period as overdue';

    public function handle(): int
    {
        // Mark pending invoices past due date as overdue immediately
        $today = now()->toDateString();

        $count = Invoice::where('status', 'pending')
            ->whereDate('due_date', '<=', $today)
            ->update(['status' => 'overdue']);

        $this->info("Marked {$count} invoices as overdue");

        return Command::SUCCESS;
    }
}
