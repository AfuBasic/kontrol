<?php

namespace App\Policies;

use App\Auth\ContextManager;
use App\Models\SecurityEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SecurityEventPolicy extends BaseContextPolicy
{
    public function viewAny(User $user): bool
    {
        if (! app(ContextManager::class)->hasContext()) {
            return false;
        }

        return $user->contextHasRole('admin') || $user->contextCan('suspicious_activity.view');
    }

    public function view(User $user, SecurityEvent $securityEvent): bool
    {
        $context = app(ContextManager::class)->current();

        if ($context === null) {
            return false;
        }

        if (! ($user->contextHasRole('admin') || $user->contextCan('suspicious_activity.view'))) {
            return false;
        }

        return $this->belongsToEstate($securityEvent, $context->estateId);
    }

    public function review(User $user, SecurityEvent $securityEvent): bool
    {
        $context = app(ContextManager::class)->current();

        if ($context === null) {
            return false;
        }

        if (! ($user->contextHasRole('admin') || $user->contextCan('suspicious_activity.review'))) {
            return false;
        }

        return $this->view($user, $securityEvent);
    }

    public function approveDevice(User $user, SecurityEvent $securityEvent): bool
    {
        return false;
    }

    private function belongsToEstate(SecurityEvent $securityEvent, int $estateId): bool
    {
        return DB::table('estate_users_membership')
            ->where('estate_id', $estateId)
            ->where('user_id', $securityEvent->user_id)
            ->where('status', 'accepted')
            ->exists();
    }
}
