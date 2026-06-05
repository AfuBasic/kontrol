<?php

namespace App\Listeners\Billing;

use App\Events\Billing\PaymentReceived;
use App\Mail\SendInvoiceMail;
use App\Models\User;
use App\Notifications\Admin\PaymentReceivedNotification;
use Illuminate\Support\Facades\Mail;

class SendPaymentReceivedNotification
{
    public function handle(PaymentReceived $event): void
    {
        // Skip individual resident invoices
        if ($event->invoice->user_id !== null) {
            return;
        }

        $estate = $event->invoice->estate;

        // Notify all estate admins
        $admins = User::withRole('admin', $estate->id)->get();

        foreach ($admins as $admin) {
            $admin->notify(new PaymentReceivedNotification($event->invoice));
        }

        // Send paid invoice email to estate
        $email = $estate->email ?? User::withRole('admin', $estate->id)->first()?->email;
        if ($email) {
            Mail::to($email)->send(new SendInvoiceMail($event->invoice));
        }
    }
}
