<?php

namespace App\Listeners\Billing;

use App\Events\Billing\PaymentReceived;
use App\Mail\SendInvoiceMail;
use App\Notifications\Admin\PaymentReceivedNotification;
use Illuminate\Support\Facades\Mail;

class SendPaymentReceivedNotification
{
    public function handle(PaymentReceived $event): void
    {
        $estate = $event->invoice->estate;

        // Notify all estate admins
        $admins = $estate->users()
            ->where('user_type', 'admin')
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new PaymentReceivedNotification($event->invoice));
        }

        // Send paid invoice email to estate
        $email = $estate->email ?? $estate->users()->first()?->email;
        if ($email) {
            Mail::to($email)->send(new SendInvoiceMail($event->invoice));
        }
    }
}
