<?php

namespace App\Listeners\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Mail\Admin\BillingInvoiceMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class SendInvoiceEmail
{
    public function handle(InvoiceGenerated $event): void
    {
        // Skip individual resident invoices
        if ($event->invoice->user_id !== null) {
            return;
        }

        $estate = $event->invoice->estate;

        // Send to all estate admins
        $admins = User::withRole('admin', $estate->id)->get();

        foreach ($admins as $admin) {
            Mail::to($admin->email)->send(new BillingInvoiceMail($event->invoice));
        }
    }
}
