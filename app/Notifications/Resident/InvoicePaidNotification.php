<?php

namespace App\Notifications\Resident;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use PdfStudio\Laravel\Facades\Pdf;

class InvoicePaidNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Invoice $invoice
    ) {
        $this->onQueue('mail');
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mailMessage = (new MailMessage)
            ->subject("Receipt for Invoice #{$this->invoice->invoice_number}")
            ->view('mail.resident.invoice-paid', [
                'invoice' => $this->invoice,
            ]);

        try {
            $pdfResult = Pdf::view('pdf.invoice-pdf')
                ->data(['invoice' => $this->invoice])
                ->render();

            $mailMessage->attachData(
                $pdfResult->content(),
                "Receipt-{$this->invoice->invoice_number}.pdf",
                ['mime' => 'application/pdf']
            );
        } catch (\Exception $e) {
            Log::error('Failed to generate receipt PDF for notification', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $mailMessage;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'invoice_paid',
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->amount,
            'formatted_amount' => $this->invoice->formatted_amount,
            'title' => 'Payment Successful',
            'message' => "Your payment for invoice #{$this->invoice->invoice_number} was successful. Thank you!",
            'action_url' => '/resident/billing',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
