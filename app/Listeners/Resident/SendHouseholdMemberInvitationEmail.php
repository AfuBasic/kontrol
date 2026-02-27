<?php

namespace App\Listeners\Resident;

use App\Events\Resident\HouseholdMemberCreated;
use App\Mail\Resident\HouseholdMemberInvitationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendHouseholdMemberInvitationEmail implements ShouldQueue
{
    public function handle(HouseholdMemberCreated $event): void
    {
        Mail::to($event->user->email)->send(
            new HouseholdMemberInvitationMail($event->user, $event->estate, $event->primaryResident)
        );
    }
}
