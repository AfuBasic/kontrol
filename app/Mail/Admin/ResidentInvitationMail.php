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

    public string $userName;

    public function __construct(
        public Invitation|User $user,
        public Estate $estate,
        public ?Invitation $invitation = null,
        public ?string $zoneName = null,
    ) {
        if ($this->user instanceof Invitation) {
            $token = $this->user->token;
            $this->userName = $this->user->email;
        } else {
            $invitation = $this->invitation ?? Invitation::withoutGlobalScopes()
                ->where('email', strtolower(trim($this->user->email)))
                ->where('estate_id', $this->estate->id)
                ->latest()
                ->first();

            $token = $invitation?->token ?? ($this->user->token ?? $this->user->id);
            $this->userName = $this->user->name;
        }

        $this->invitationUrl = route('invitations.show', ['token' => $token]);
    }

    public function envelope(): Envelope
    {
        $subject = "You've been invited to join {$this->estate->name}";

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
                'userName' => $this->userName,
                'invitationUrl' => $this->invitationUrl,
                'zoneName' => $this->zoneName,
            ],
        );
    }
}
