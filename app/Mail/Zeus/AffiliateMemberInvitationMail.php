<?php

namespace App\Mail\Zeus;

use App\Models\Affiliate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class AffiliateMemberInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Affiliate $affiliate,
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
            subject: "You've been invited to join {$this->affiliate->name} as an affiliate member",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.zeus.affiliate-member-invitation',
            with: [
                'affiliateName' => $this->affiliate->name,
                'userName' => $this->user->name,
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
