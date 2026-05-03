<?php

namespace App\Notifications\Admin;

use App\Models\Invoice;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class PaymentReceivedNotification extends Notification
{
    public function __construct(
        public Invoice $invoice,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'message' => "Payment of {$this->invoice->formatted_amount} received for invoice {$this->invoice->invoice_number}",
            'action_url' => route('admin.billing.invoices.show', $this->invoice->id),
            'type' => 'success',
            'invoice_id' => $this->invoice->id,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
