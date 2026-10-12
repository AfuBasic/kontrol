<?php

namespace App\Listeners\Admin;

use App\Auth\ContextManager;
use App\Events\Admin\SecurityCreated;
use App\Mail\Admin\SecurityInvitationMail;
use App\Support\Queues;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendSecurityInvitationEmail implements ShouldQueue
{
    public string $queue = Queues::MAIL;

    public function handle(SecurityCreated $event): void
    {
        app(ContextManager::class)->setSystemContext($event->estate->id);

        Mail::to($event->user->email)->send(
            new SecurityInvitationMail($event->user, $event->estate)
        );
    }
}
