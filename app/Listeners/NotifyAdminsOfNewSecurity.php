<?php

namespace App\Listeners;

use App\Events\Admin\SecurityCreated;
use App\Notifications\SecurityInvitedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class NotifyAdminsOfNewSecurity implements ShouldQueue
{
    public function handle(SecurityCreated $event): void
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

        Notification::send($admins, new SecurityInvitedNotification($event->user, $event->estate));
    }
}
