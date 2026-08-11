<?php

namespace App\Listeners;

use App\Events\Admin\ResidentCreated;
use App\Auth\ContextManager;
use App\Notifications\Admin\ResidentInvited;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class NotifyAdminsOfNewResident implements ShouldQueue
{
    public function handle(ResidentCreated $event): void
    {
        if ($event->isPasswordReset) {
            return;
        }

        // Set team context for role check
        app(ContextManager::class)->setSystemContext($event->estate->id);

        // Get all admin users for this estate except the current user (the inviter)
        $admins = $event->estate->users()
            ->wherePivot('status', 'accepted')
            ->get()
            ->filter(fn ($user) => $user->hasRole('admin') && $user->id !== Auth::id());

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new ResidentInvited($event->user, $event->estate->name, Auth::user()?->name ?? 'System'));
        }
    }
}
