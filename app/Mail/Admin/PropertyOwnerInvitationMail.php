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

class PropertyOwnerInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Estate $estate,
        public bool $isResend = false,
    ) {
        // Generate signed URL on app domain that expires in 72 hours
        $parameters = ['token' => $user->id];

        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        URL::forceRootUrl("{$scheme}://{$appDomain}");

        $this->invitationUrl = URL::temporarySignedRoute(
            'invitation.accept',
            now()->addHours(72),
            $parameters
        );

        URL::forceRootUrl(null);
    }

    public function envelope(): Envelope
    {
        $subject = $this->isResend
            ? "Your invitation to {$this->estate->name} has been resent"
            : "You've been invited to join {$this->estate->name} as a Property Owner";

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.admin.property-owner-invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $this->user->name,
                'invitationUrl' => $this->invitationUrl,
                'isResend' => $this->isResend,
            ],
        );
    }
}
