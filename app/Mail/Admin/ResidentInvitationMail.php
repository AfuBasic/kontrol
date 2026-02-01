<?php

namespace App\Mail\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class ResidentInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Estate $estate,
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
            subject: "You've been invited to join {$this->estate->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admin.resident-invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $this->user->name,
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
