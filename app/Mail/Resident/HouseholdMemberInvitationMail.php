<?php

namespace App\Mail\Resident;

use App\Actions\Invitation\CreateInvitationAction;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Spatie\Permission\Models\Role;

class HouseholdMemberInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $invitationUrl;

    public function __construct(
        public User $user,
        public Estate $estate,
        public User $primaryResident,
        public bool $passwordReset = false,
        public ?Invitation $invitation = null,
    ) {
        $invitation = $this->invitation ?? Invitation::withoutGlobalScopes()
            ->where('email', strtolower(trim($this->user->email)))
            ->where('estate_id', $this->estate->id)
            ->latest()
            ->first();

        if (! $invitation) {
            $role = Role::where('name', 'household_member')->where('guard_name', 'web')->whereNull('estate_id')->first();
            $invitation = app(CreateInvitationAction::class)->execute(
                email: $this->user->email,
                estate: $this->estate,
                relationshipType: 'household_member',
                role: $role,
                zoneId: $this->primaryResident->getZoneForEstate($this->estate)?->id,
                createdBy: $this->primaryResident,
            );
        }

        $this->invitationUrl = route('invitations.show', ['token' => $invitation->token]);
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
