<?php

namespace App\Notifications\Admin;

use App\Models\Invoice;
use Illuminate\Broadcasting\BroadcastMessage;
use Illuminate\Notifications\Notification;

class InvoiceGeneratedNotification extends Notification
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
            'message' => "Invoice {$this->invoice->invoice_number} for {$this->invoice->formatted_amount} has been generated",
            'action_url' => route('admin.billing.invoices.show', $this->invoice->id),
            'type' => 'info',
            'invoice_id' => $this->invoice->id,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
