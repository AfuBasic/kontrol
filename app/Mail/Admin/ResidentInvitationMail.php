<?php

namespace App\Mail\Admin;

use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResidentInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public Invitation|User $user,
        public Estate $estate,
        public bool $isPasswordReset = false,
    ) {
        $token = $this->user instanceof Invitation ? $this->user->token : ($this->user->token ?? $this->user->id);
        $this->invitationUrl = route('invitations.show', ['token' => $token]);
    }

    public function envelope(): Envelope
    {
        $subject = $this->isPasswordReset
            ? "Password Reset Request for {$this->estate->name}"
            : "You've been invited to join {$this->estate->name}";

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {

        return new Content(
            view: 'mail.admin.resident-invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $this->user->name,
                'invitationUrl' => $this->invitationUrl,
                'isPasswordReset' => $this->isPasswordReset,
            ],
        );
    }
}
