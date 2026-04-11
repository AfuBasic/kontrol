<?php

namespace App\Mail\Admin;

use App\Models\EstateSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BillingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EstateSubscription $subscription,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: config('mail.from.address'),
            subject: 'Billing Reminder - Invoice Coming in 7 Days',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.admin.billing-reminder',
            with: [
                'subscription' => $this->subscription,
                'estate' => $this->subscription->estate,
                'plan' => $this->subscription->plan,
                'nextBillingDate' => $this->subscription->next_billing_date,
            ],
        );
    }
}
