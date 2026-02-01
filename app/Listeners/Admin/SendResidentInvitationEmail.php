<?php

namespace App\Listeners\Admin;

use App\Events\Admin\ResidentCreated;
use App\Mail\Admin\ResidentInvitationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendResidentInvitationEmail implements ShouldQueue
{
    public function handle(ResidentCreated $event): void
    {
        Mail::to($event->user->email)->send(
            new ResidentInvitationMail($event->user, $event->estate, $event->isPasswordReset)
        );
    }
}
