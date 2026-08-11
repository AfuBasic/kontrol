<?php

namespace App\Actions\Auth;

use App\Models\User;
use App\Auth\ContextManager;
use Illuminate\Http\Request;

class CheckTrustedDevice
{
    /**
     * Check if the current device is trusted for the given user.
     * Returns true (skip OTP) for non-resident roles.
     */
    public function execute(User $user, Request $request): bool
    {
        // Set team context so Spatie Permission can resolve estate-scoped role assignments
        $estate = $user->estates()->wherePivot('status', 'accepted')->first();
        if ($estate) {
            app(ContextManager::class)->setSystemContext($estate->id);
        }

        if (! $user->hasRole('resident') && ! $user->hasRole('household_member')) {
            return true;
        }

        $userAgentHash = hash('sha256', $request->userAgent() ?? '');

        $device = $user->trustedDevices()
            ->where('user_agent_hash', $userAgentHash)
            ->first();

        if ($device) {
            $device->update([
                'last_used_at' => now(),
                'ip_address' => $request->ip(),
            ]);

            return true;
        }

        return false;
    }
}
