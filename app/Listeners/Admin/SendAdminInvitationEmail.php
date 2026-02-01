<?php

namespace App\Listeners\Admin;

use App\Events\Admin\UserCreated;
use App\Mail\Admin\AdminInvitationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendAdminInvitationEmail implements ShouldQueue
{
    public function handle(UserCreated $event): void
    {
        Mail::to($event->user->email)->send(
            new AdminInvitationMail($event->user, $event->estate)
        );
    }
}
