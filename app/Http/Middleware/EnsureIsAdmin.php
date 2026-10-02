<?php

namespace App\Http\Middleware;

use App\Auth\ContextManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures only admin users can access admin routes.
 * Redirects residents to /resident, security to /security, and role-less
 * organization/partner users to their own area.
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

        // Everyone else must actually hold a staff role (admin, manager, estate-assigned custom role).
        // A user with none, such as an organization or partner member, has no business here.
        $context = app(ContextManager::class)->current();
        $hasAssignment = $context !== null && $context->assignmentId > 0;

        if (! $hasAssignment && $user->getRoleNames()->isEmpty()) {
            if ($user->organizationMemberships()->where('is_active', true)->exists()) {
                return redirect()->route('org.dashboard');
            }

            if ($user->partner_id) {
                return redirect()->route('partner.dashboard');
            }

            abort(403, 'You do not have access to the admin area.');
        }

        return $next($request);
    }
}
