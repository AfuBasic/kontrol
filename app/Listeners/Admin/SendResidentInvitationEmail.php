<?php

namespace App\Listeners\Admin;

use App\Auth\ContextManager;
use App\Events\Admin\ResidentCreated;
use App\Mail\Admin\PropertyOwnerInvitationMail;
use App\Mail\Admin\ResidentInvitationMail;
use App\Models\Zone;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendResidentInvitationEmail implements ShouldQueue
{
    public function handle(ResidentCreated $event): void
    {
        app(ContextManager::class)->setSystemContext($event->estate->id);

        $membership = DB::table('estate_users_membership')
            ->where('user_id', $event->user->id)
            ->where('estate_id', $event->estate->id)
            ->first();

        $zoneName = null;
        if ($membership?->zone_id) {
            $zoneName = Zone::find($membership->zone_id)?->name;
        }

        $mailable = $event->user->hasRole('property_owner')
            ? new PropertyOwnerInvitationMail($event->user, $event->estate, $event->isResend)
            : new ResidentInvitationMail($event->user, $event->estate, null, $zoneName);

        Mail::to($event->user->email)->send($mailable);
    }
}
