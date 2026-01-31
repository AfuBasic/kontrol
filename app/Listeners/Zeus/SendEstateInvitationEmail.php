<?php

namespace App\Listeners\Zeus;

use App\Events\Zeus\EstateCreated;
use App\Mail\Zeus\EstateInvitationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendEstateInvitationEmail implements ShouldQueue
{
    public function handle(EstateCreated $event): void
    {
        Mail::to($event->user->email)->send(
            new EstateInvitationMail($event->estate, $event->user)
        );
    }
}
