<?php

namespace App\Actions\Auth;

use App\Models\User;

class DetermineUserRedirect
{
    /**
     * Determine the redirect URL based on user's role.
     */
    public function execute(User $user): string
    {
        // Set the team context for Spatie Permission (use user's first accepted estate)
        $estate = $user->estates()->wherePivot('status', 'accepted')->first();
        if ($estate) {
            setPermissionsTeamId($estate->id);
        }

        // Check for global roles first (security, resident)
        if ($user->hasRole('security')) {
            return route('security.dashboard');
        }

        if ($user->hasRole('resident')) {
            return route('resident.dashboard');
        }

        // Default to admin module for any other role (including estate-scoped 'admin')
        return route('admin.dashboard');
    }
}
