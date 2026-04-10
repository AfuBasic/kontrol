<?php

namespace App\Mail\Zeus;

use App\Models\Referrer;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class ReferrerMemberInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Referrer $referrer,
    ) {
        // Generate signed URL on app domain that expires in 72 hours
        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        URL::forceRootUrl("{$scheme}://{$appDomain}");

        $this->invitationUrl = URL::temporarySignedRoute(
            'invitation.accept',
            now()->addHours(72),
            ['user' => $user->id]
        );

        URL::forceRootUrl(null);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've been invited to join {$this->referrer->name} as a referrer member",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.zeus.referrer-member-invitation',
            with: [
                'referrerName' => $this->referrer->name,
                'userName' => $this->user->name,
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
