<?php

namespace App\Mail;

use App\Models\AccessCode;
use App\Models\OrganizationBulkInviteRecipient;
use App\Services\Visitor\BulkInvitePdfService;
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
        public ?string $pdfContents = null,
        public ?OrganizationBulkInviteRecipient $recipient = null,
    ) {
        $this->passUrl = route('public.pass', ['uuid' => $this->accessCode->pass_uuid]);
    }

    /**
     * What the pass says, shared with the PDF so the two never disagree. Null only if the pass somehow has
     * no recipient to describe, in which case the email falls back to the essentials.
     *
     * @return array<string, mixed>|null
     */
    private function facts(): ?array
    {
        $recipient = $this->recipient ?? $this->accessCode->bulkInviteRecipient;

        return $recipient ? app(BulkInvitePdfService::class)->passFacts($recipient, $this->accessCode) : null;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $facts = $this->facts();

        $orgName = $facts['organizationName']
            ?? $this->accessCode->bulkInviteRecipient?->bulkInvite?->organization?->name
            ?? 'Organization';

        $subject = ! empty($facts['batchLabel'])
            ? "Your pass for {$facts['batchLabel']} · {$orgName}"
            : "Your visitor pass · {$orgName}";

        return new Envelope(subject: $subject);
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $facts = $this->facts() ?? [
            'organizationName' => $this->accessCode->bulkInviteRecipient?->bulkInvite?->organization?->name ?? 'Organization',
            'estateName' => $this->accessCode->estate?->name ?? 'Estate',
            'hostName' => null,
            'hostUnit' => null,
            'maskedEmail' => null,
            'batchLabel' => null,
            'entryMode' => app(BulkInvitePdfService::class)->entryMode((string) $this->accessCode->type),
            'passNumber' => null,
            'passTotal' => null,
            'validFrom' => $this->accessCode->starts_at?->format('M d, Y') ?? 'Today',
            'validUntil' => $this->accessCode->expires_at?->format('M d, Y') ?? 'N/A',
        ];

        return new Content(
            view: 'mail.visitor.bulk-pass',
            with: [
                ...$facts,
                'accessCode' => $this->accessCode,
                'passUrl' => $this->passUrl,
                'hasPdf' => $this->pdfContents !== null,
                'colors' => app(BulkInvitePdfService::class)->colors(),
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
