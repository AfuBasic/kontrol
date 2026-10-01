<?php

namespace App\Mail;

use App\Models\AccessCode;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent synchronously from DeliverBulkVisitorPassJob, which is already queued and owns retries.
 * It must not implement ShouldQueue: queuing it again detaches the send from the job, so the
 * job would record "sent" before anything was sent, and the PDF would be gone before the mail went out.
 */
class BulkVisitorPassMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $passUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public AccessCode $accessCode,
        public ?string $pdfContents = null
    ) {
        $this->passUrl = route('public.pass', ['uuid' => $this->accessCode->pass_uuid]);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $orgName = $this->accessCode->organizationMember?->organization?->name
            ?? $this->accessCode->bulkInviteRecipient?->bulkInvite?->organization?->name
            ?? 'Organization';

        return new Envelope(
            subject: "Your Visitor Access Pass - {$orgName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.visitor.bulk-pass',
            with: [
                'accessCode' => $this->accessCode,
                'passUrl' => $this->passUrl,
                'estateName' => $this->accessCode->estate?->name ?? 'Estate',
                'organizationName' => $this->accessCode->bulkInviteRecipient?->bulkInvite?->organization?->name ?? 'Organization',
                'validFrom' => $this->accessCode->starts_at?->toFormattedDateString() ?? 'Today',
                'validUntil' => $this->accessCode->expires_at?->toFormattedDateString() ?? 'N/A',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if ($this->pdfContents) {
            return [
                Attachment::fromData(fn () => $this->pdfContents, "Visitor-Pass-{$this->accessCode->code}.pdf")
                    ->withMime('application/pdf'),
            ];
        }

        return [];
    }
}
