<?php

namespace App\Listeners;

use App\Events\Billing\InvoiceGenerated;
use App\Mail\SendInvoiceMail;
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
        $email = $event->invoice->estate->email ?? $event->invoice->estate->users()->first()?->email;

        if (! $email) {
            return;
        }

        Mail::to($email)->send(new SendInvoiceMail($event->invoice));
    }
}
