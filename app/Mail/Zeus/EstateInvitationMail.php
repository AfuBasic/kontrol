<?php

namespace App\Mail\Zeus;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class EstateInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public Estate $estate,
        public User $user,
    ) {
        // Generate signed URL that expires in 72 hours
        $this->invitationUrl = URL::temporarySignedRoute(
            'invitation.accept',
            now()->addHours(72),
            ['user' => $user->id]
        );
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've been invited to manage {$this->estate->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.zeus.estate-invitation',
            with: [
                'estateName' => $this->estate->name,
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
