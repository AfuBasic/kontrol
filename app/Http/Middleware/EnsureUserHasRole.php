<?php

namespace App\Http\Middleware;

use App\Services\Platform\PlatformAccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function __construct() {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string  ...$roles  The roles allowed to access this route
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect('/login');
        }

        $globalRoles = ['affiliate'];

        // Check platform-wide roles first (stored against estate_id = 0)
        foreach ($roles as $role) {
            if (in_array($role, $globalRoles, true)) {
                setPermissionsTeamId(0);
                $user->unsetRelation('roles'); // Clear cached roles to apply the new team context

                if ($user->hasRole($role)) {
                    return $next($request);
                }
            }
        }

        // Set the team context for Spatie Permission (use user's first accepted estate)
        $estate = $user->estates()->wherePivot('status', 'accepted')->first();
        if ($estate) {
            setPermissionsTeamId($estate->id);
            $user->unsetRelation('roles'); // Clear cached roles to apply the estate context
        }

        // Check if user has any of the allowed roles
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                // Evaluate platform access via centralized PlatformAccessService
                $accessResult = app(PlatformAccessService::class)->evaluate($request, $user);
                if (! $accessResult->allowed && $accessResult->redirectUrl) {
                    return redirect($accessResult->redirectUrl);
                }

                return $next($request);
            }
        }

        // User doesn't have the required role
        abort(403, 'You do not have permission to access this resource.');
    }
}
