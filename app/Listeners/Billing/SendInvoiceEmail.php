<?php

namespace App\Listeners\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Mail\Admin\BillingInvoiceMail;
use Illuminate\Support\Facades\Mail;

class SendInvoiceEmail
{
    public function handle(InvoiceGenerated $event): void
    {
        $estate = $event->invoice->estate;

        // Send to all estate admins
        $admins = $estate->users()
            ->where('user_type', 'admin')
            ->get();

        foreach ($admins as $admin) {
            Mail::to($admin->email)->send(new BillingInvoiceMail($event->invoice));
        }
    }
}
