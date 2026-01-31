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
        // Check for global roles first (security, resident)
        if ($user->hasRole('security')) {
            return '/security/dashboard';
        }

        if ($user->hasRole('resident')) {
            return '/resident/dashboard';
        }

        // Default to admin module for any other role (including estate-scoped 'admin')
        return '/admin/dashboard';
    }
}
