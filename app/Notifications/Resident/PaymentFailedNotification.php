<?php

namespace App\Notifications\Resident;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Invoice $invoice,
        public string $reason = 'Your payment method could not be charged.',
        public int $attempts = 1,
        public int $maxAttempts = 3
    ) {
        $this->onQueue('mail');
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Important: Payment Failed for Your Subscription')
            ->view('mail.resident.payment-failed', [
                'invoice' => $this->invoice,
                'reason' => $this->reason,
                'attempts' => $this->attempts,
                'maxAttempts' => $this->maxAttempts,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $isFinalAttempt = $this->attempts >= $this->maxAttempts;

        return [
            'type' => 'payment_failed',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'attempts' => $this->attempts,
            'max_attempts' => $this->maxAttempts,
            'is_final_attempt' => $isFinalAttempt,
            'title' => $isFinalAttempt ? 'Final Payment Attempt Failed' : 'Payment Failed',
            'message' => $isFinalAttempt
                ? "Final attempt to charge your card for invoice #{$this->invoice->invoice_number} failed. Your subscription access may be restricted."
                : "Payment attempt #{$this->attempts} for invoice #{$this->invoice->invoice_number} failed. We will try again automatically.",
            'action_url' => '/resident/billing',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
