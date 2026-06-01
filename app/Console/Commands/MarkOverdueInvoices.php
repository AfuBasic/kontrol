<?php

namespace App\Console\Commands;

use App\Mail\CommandExecutedMail;
use App\Models\Invoice;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

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

        try {
            Mail::to('support@usekontrol.com')->queue(new CommandExecutedMail(
                'Command Executed: kontrol:mark-overdue-invoices',
                "Command 'kontrol:mark-overdue-invoices' executed successfully at ".now()->toDateTimeString().'. Total invoices marked overdue: '.$count
            ));
        } catch (\Throwable $e) {
            $this->error('Failed to send mail: '.$e->getMessage());
        }

        return Command::SUCCESS;
    }
}
