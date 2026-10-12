<?php

namespace App\Listeners\Admin;

use App\Events\Admin\UserCreated;
use App\Mail\Admin\AdminInvitationMail;
use App\Support\Queues;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendAdminInvitationEmail implements ShouldQueue
{
    public string $queue = Queues::MAIL;

    public function handle(UserCreated $event): void
    {
        Mail::to($event->user->email)->send(
            new AdminInvitationMail($event->user, $event->estate)
        );
    }
}
