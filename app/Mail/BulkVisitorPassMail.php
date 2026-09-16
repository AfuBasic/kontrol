<?php

namespace App\Mail;

use App\Models\AccessCode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BulkVisitorPassMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $passUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public AccessCode $accessCode
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
            subject: "Your Visitor Access Pass — {$orgName}",
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
}
