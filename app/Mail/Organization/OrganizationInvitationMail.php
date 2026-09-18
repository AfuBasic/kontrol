<?php

namespace App\Mail\Organization;

use App\Actions\Auth\GenerateMagicLoginUrlAction;
use App\Models\EstateOrganization;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class OrganizationInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $actionUrl;

    public bool $isExistingUser;

    public function __construct(
        public User $user,
        public EstateOrganization $organization,
        public string $role = 'member',
        ?bool $isExistingUser = null,
    ) {
        // In an OTP-based system there are no passwords. The signal for "can this user
        // log in on their own" is whether their email has previously been verified.
        // Verified → they can receive an OTP and log in normally (send "role added" email).
        // Not verified → brand-new to the platform, needs a magic link to bootstrap access.
        $this->isExistingUser = $isExistingUser ?? ($this->user->hasVerifiedEmail() || ! is_null($this->user->google_id));

        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        if ($this->isExistingUser) {
            $this->actionUrl = route('login');
        } else {
            URL::forceRootUrl("{$scheme}://{$appDomain}");

            // Generate a 72-hour magic login link to let new user access their account
            $this->actionUrl = app(GenerateMagicLoginUrlAction::class)->execute(
                user: $user,
                destination: route('org.dashboard', [], false),
                ttlMinutes: 72 * 60
            );

            URL::forceRootUrl(null);
        }
    }

    public function envelope(): Envelope
    {
        $roleTitle = $this->role === 'admin' ? 'Administrator' : 'Staff Member';

        $subject = $this->isExistingUser
            ? "New role added: {$roleTitle} at {$this->organization->name}"
            : "You've been invited to join {$this->organization->name} on Kontrol";

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.organization.invitation',
            with: [
                'organizationName' => $this->organization->name,
                'estateName' => $this->organization->estate?->name ?? 'Estate',
                'userName' => $this->user->name,
                'roleTitle' => $this->role === 'admin' ? 'Administrator' : 'Staff Member',
                'actionUrl' => $this->actionUrl,
                'isExistingUser' => $this->isExistingUser,
            ],
        );
    }
}
