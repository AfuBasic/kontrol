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
        } else {
            setPermissionsTeamId(0);
        }

        // Check for global roles first (security, household_member, resident)
        if ($user->hasRole('security')) {
            return route('security.dashboard');
        }

        if ($user->hasRole('household_member')) {
            return route('resident.home');
        }

        if ($user->hasRole('resident')) {
            return route('resident.dashboard');
        }

        // Partner portal members
        if ($user->user_type === 'affiliate') {
            setPermissionsTeamId(0);

            return route('partner.dashboard');
        }

        // Default to admin module for any other role (including estate-scoped 'admin')
        return route('admin.dashboard');
    }
}
