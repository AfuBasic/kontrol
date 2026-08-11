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
use Illuminate\Support\Facades\URL;

class ResidentInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public Invitation $invitation,
        public Estate $estate,
        public bool $isPasswordReset = false,
    ) {
        // Use the secure token for the URL
        $parameters = ['token' => $this->invitation->token];
        if ($this->isPasswordReset) {
            $parameters['password_reset'] = 1;
        }

        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        URL::forceRootUrl("{$scheme}://{$appDomain}");

        // The token is secure, so we can use a standard route, but we'll use route() and rely on the controller to validate expiration
        $this->invitationUrl = route('invitation.accept', $parameters);

        URL::forceRootUrl(null);
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
        $userName = User::where('email', $this->invitation->email)->value('name') ?? 'Resident';

        return new Content(
            view: 'mail.admin.resident-invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $userName,
                'invitationUrl' => $this->invitationUrl,
                'isPasswordReset' => $this->isPasswordReset,
            ],
        );
    }
}
