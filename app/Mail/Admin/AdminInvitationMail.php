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
use App\Actions\Auth\GenerateMagicLoginUrlAction;

class AdminInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Estate $estate,
    ) {
        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        URL::forceRootUrl("{$scheme}://{$appDomain}");

        // Generate a 72-hour magic login link to let them access their account
        $this->invitationUrl = app(GenerateMagicLoginUrlAction::class)->execute(
            user: $user,
            destination: route('admin.dashboard', [], false),
            ttlMinutes: 72 * 60
        );

        URL::forceRootUrl(null);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've been invited to join {$this->estate->name} as an Administrator",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.admin.invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $this->user->name,
                'roleName' => 'Administrator',
                'invitationUrl' => $this->invitationUrl,
            ],
        );
    }
}
