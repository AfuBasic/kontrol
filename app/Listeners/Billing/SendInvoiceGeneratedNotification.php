<?php

namespace App\Listeners\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Notifications\Admin\InvoiceGeneratedNotification;

class SendInvoiceGeneratedNotification
{
    public function handle(InvoiceGenerated $event): void
    {
        $estate = $event->invoice->estate;

        // Notify all estate admins
        $admins = $estate->users()
            ->where('user_type', 'admin')
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new InvoiceGeneratedNotification($event->invoice));
        }
    }
}
