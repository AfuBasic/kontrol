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

        // If user is a resident, redirect to resident area
        if ($user->hasRole('resident') && ! $user->hasRole('admin')) {
            return redirect()->route('resident.home');
        }

        // If user is security, redirect to security area
        if ($user->hasRole('security') && ! $user->hasRole('admin')) {
            return redirect()->route('security.dashboard');
        }

        return $next($request);
    }
}
