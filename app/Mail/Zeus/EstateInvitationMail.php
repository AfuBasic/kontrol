<?php

namespace App\Mail\Zeus;

use App\Models\Estate;
use App\Models\Invitation;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class EstateInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public Estate $estate,
        public User $user,
        public ?Invitation $invitation = null,
    ) {
        $invitation = $this->invitation ?? Invitation::withoutGlobalScope(ZoneScope::class)
            ->where('estate_id', $estate->id)
            ->where('email', strtolower($user->email))
            ->where('status', 'pending')
            ->latest()
            ->first();

        if (! $invitation) {
            $invitation = Invitation::withoutGlobalScope(ZoneScope::class)->create([
                'estate_id' => $estate->id,
                'email' => strtolower($user->email),
                'relationship_type' => null,
                'token' => Str::random(64),
                'status' => 'pending',
                'expires_at' => now()->addDays(7),
            ]);
        }

        // Generate URL on app domain
        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        URL::forceRootUrl("{$scheme}://{$appDomain}");

        $this->invitationUrl = route('invitations.show', ['token' => $invitation->token]);

        URL::forceRootUrl(null);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Kontrol administrator account is ready - {$this->estate->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.zeus.estate-invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $this->user->name,
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
