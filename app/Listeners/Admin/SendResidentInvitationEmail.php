<?php

namespace App\Listeners\Admin;

use App\Events\Admin\ResidentCreated;
use App\Auth\ContextManager;
use App\Mail\Admin\PropertyOwnerInvitationMail;
use App\Mail\Admin\ResidentInvitationMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendResidentInvitationEmail implements ShouldQueue
{
    public function handle(ResidentCreated $event): void
    {
        app(ContextManager::class)->setSystemContext($event->estate->id);

        $mailable = $event->user->hasRole('property_owner')
            ? new PropertyOwnerInvitationMail($event->user, $event->estate, $event->isPasswordReset)
            : new ResidentInvitationMail($event->user, $event->estate, $event->isPasswordReset);

        Mail::to($event->user->email)->send($mailable);
    }
}
