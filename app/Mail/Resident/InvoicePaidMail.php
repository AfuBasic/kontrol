<?php

namespace App\Mail\Resident;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use PdfStudio\Laravel\Facades\Pdf;

class InvoicePaidMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Invoice $invoice
    ) {
        $this->onQueue('mail');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Receipt for Invoice #{$this->invoice->invoice_number}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.resident.invoice-paid',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        try {
            $pdfResult = Pdf::view('pdf.invoice-pdf')
                ->data(['invoice' => $this->invoice])
                ->render();

            return [
                Attachment::fromData(fn () => $pdfResult->content(), "Receipt-{$this->invoice->invoice_number}.pdf")
                    ->withMime('application/pdf'),
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to generate receipt PDF', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
