<?php

namespace App\Listeners\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Models\User;
use App\Notifications\Admin\InvoiceGeneratedNotification;

class SendInvoiceGeneratedNotification
{
    public function handle(InvoiceGenerated $event): void
    {
        // Skip individual resident invoices
        if ($event->invoice->user_id !== null) {
            return;
        }

        $estate = $event->invoice->estate;

        // Notify all estate admins
        $admins = User::withRole('admin', $estate->id)->get();

        foreach ($admins as $admin) {
            $admin->notify(new InvoiceGeneratedNotification($event->invoice));
        }
    }
}
