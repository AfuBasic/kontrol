<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use PdfStudio\Laravel\Facades\Pdf;

class SendInvoiceMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Invoice {$this->invoice->invoice_number} - Kontrol",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.admin.billing-invoice',
            with: [
                'invoice' => $this->invoice,
            ],
        );
    }

    public function attachments(): array
    {
        try {
            $pdfResult = Pdf::view('pdf.invoice-pdf')
                ->data(['invoice' => $this->invoice])
                ->render();

            return [
                Attachment::fromData(fn () => $pdfResult->content(), "Invoice-{$this->invoice->invoice_number}.pdf")
                    ->withMime('application/pdf'),
            ];
        } catch (\Exception $e) {
            // If PDF generation fails, send email without attachment
            \Log::error('Failed to generate invoice PDF', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
