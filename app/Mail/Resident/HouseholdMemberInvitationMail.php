<?php

namespace App\Mail\Resident;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class HouseholdMemberInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Estate $estate,
        public User $primaryResident,
        public bool $passwordReset = false,
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
        $subject = $this->passwordReset
            ? "Password reset for {$this->estate->name}"
            : "You've been invited to join {$this->estate->name}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.resident.household-member-invitation',
            with: [
                'estateName' => $this->estate->name,
                'userName' => $this->user->name,
                'primaryResidentName' => $this->primaryResident->name,
                'invitationUrl' => $this->invitationUrl,
                'passwordReset' => $this->passwordReset,
            ],
        );
    }
}
