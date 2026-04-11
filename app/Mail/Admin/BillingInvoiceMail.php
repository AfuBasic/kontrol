<?php

namespace App\Mail\Admin;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BillingInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: config('mail.from.address'),
            subject: "Invoice {$this->invoice->invoice_number} - {$this->invoice->estate->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.admin.billing-invoice',
            with: [
                'invoice' => $this->invoice,
                'estate' => $this->invoice->estate,
                'plan' => $this->invoice->plan,
                'payUrl' => route('admin.billing.invoices.pay', $this->invoice->id),
            ],
        );
    }
}
