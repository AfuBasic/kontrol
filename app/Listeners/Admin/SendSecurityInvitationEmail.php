<?php

namespace App\Listeners\Admin;

use App\Events\Admin\SecurityCreated;
use App\Mail\Admin\SecurityInvitationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendSecurityInvitationEmail implements ShouldQueue
{
    public function handle(SecurityCreated $event): void
    {
        Mail::to($event->user->email)->send(
            new SecurityInvitationMail($event->user, $event->estate, $event->isPasswordReset)
        );
    }
}
