<?php

namespace App\Http\Middleware;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
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
        // We look directly at assignments for platform roles
        foreach ($roles as $role) {
            if (in_array($role, $globalRoles, true)) {
                $hasGlobalRole = AdministrativeAssignment::where('user_id', $user->id)
                    ->where('estate_id', 0)
                    ->whereHas('role', fn ($q) => $q->where('name', $role))
                    ->exists();

                if ($hasGlobalRole) {
                    return $next($request);
                }
            }
        }

        // We should ensure the context is loaded before checking roles
        $context = app(ContextManager::class)->current();
        if (! $context) {
            abort(403, 'No active estate context.');
        }

        // Check if user has any of the allowed roles using context
        foreach ($roles as $role) {
            if ($user->contextHasRole($role)) {
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
