<?php

namespace App\Listeners;

use App\Events\Billing\InvoiceGenerated;
use App\Mail\SendInvoiceMail;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendInvoiceGeneratedEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(InvoiceGenerated $event): void
    {
        // Skip individual resident invoices
        if ($event->invoice->user_id !== null) {
            return;
        }

        $email = $event->invoice->estate->email ?? User::withRole('admin', $event->invoice->estate_id)->first()?->email;

        if (! $email) {
            return;
        }

        Mail::to($email)->send(new SendInvoiceMail($event->invoice));
    }
}
