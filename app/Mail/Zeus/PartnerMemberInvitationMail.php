<?php

namespace App\Mail\Zeus;

use App\Models\Partner;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class PartnerMemberInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Partner $partner,
    ) {
        $appDomain = config('domains.app');
        $scheme = request()->scheme();

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
            subject: "You've been invited to join {$this->partner->name} on Kontrol",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.zeus.partner-member-invitation',
            with: [
                'partnerName' => $this->partner->name,
                'userName' => $this->user->name,
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
