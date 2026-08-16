<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures only admin users can access admin routes.
 * Redirects residents to /resident and security to /security.
 */
class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $residentRoles = ['resident', 'household_member', 'property_owner'];

        // If user's active context is a resident role, redirect to resident home
        if ($user->contextHasRole($residentRoles)) {
            return redirect()->route('resident.home');
        }

        // If user's active context is security, redirect to security area
        if ($user->contextHasRole('security')) {
            return redirect()->route('security.dashboard');
        }

        // All other roles (admin, manager, custom roles) are permitted
        return $next($request);
    }
}
