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

class SecurityInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public string $userName;

    public bool $isExistingUser;

    public function __construct(
        public Invitation|User $user,
        public Estate $estate,
        public ?Invitation $invitation = null,
        ?bool $isExistingUser = null,
    ) {
        if ($this->user instanceof Invitation) {
            $token = $this->user->token;
            $this->userName = $this->user->email;
            $this->isExistingUser = $isExistingUser ?? (User::where('email', strtolower(trim($this->user->email)))->whereNotNull('password')->exists());
        } else {
            $invitation = $this->invitation ?? Invitation::withoutGlobalScopes()
                ->where('email', strtolower(trim($this->user->email)))
                ->where('estate_id', $this->estate->id)
                ->latest()
                ->first();

            $token = $invitation?->token ?? ($this->user->token ?? $this->user->id);
            $this->userName = $this->user->name;
            $this->isExistingUser = $isExistingUser ?? (! is_null($this->user->password));
        }

        $this->invitationUrl = $this->isExistingUser
            ? route('login')
            : route('invitations.show', ['token' => $token]);
    }

    public function envelope(): Envelope
    {
        $subject = $this->isExistingUser
            ? "New role added: Security Personnel at {$this->estate->name}"
            : "You've been invited to join {$this->estate->name}";

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.admin.security-invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $this->userName,
                'invitationUrl' => $this->invitationUrl,
                'isExistingUser' => $this->isExistingUser,
            ],
        );
    }
}
