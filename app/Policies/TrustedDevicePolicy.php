<?php

namespace App\Policies;

use App\Models\TrustedDevice;
use App\Models\User;

class TrustedDevicePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, TrustedDevice $trustedDevice): bool
    {
        return $user->id === $trustedDevice->user_id;
    }

    public function delete(User $user, TrustedDevice $trustedDevice): bool
    {
        return $user->id === $trustedDevice->user_id
            && $trustedDevice->revoked_at === null;
    }
}
