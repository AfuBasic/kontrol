<?php

namespace App\Listeners;

use App\Events\Admin\ResidentCreated;
use App\Notifications\ResidentInvitedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class NotifyAdminsOfNewResident implements ShouldQueue
{
    public function handle(ResidentCreated $event): void
    {
        if ($event->isPasswordReset) {
            return;
        }

        // Set team context for role check
        setPermissionsTeamId($event->estate->id);

        // Get all admin users for this estate
        $admins = $event->estate->users()
            ->wherePivot('status', 'accepted')
            ->get()
            ->filter(fn ($user) => $user->hasRole('admin'));

        Notification::send($admins, new ResidentInvitedNotification($event->user, $event->estate));
    }
}
