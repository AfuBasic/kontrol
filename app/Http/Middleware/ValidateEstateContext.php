<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateEstateContext
{
    public function __construct(
        private \App\Services\EstateContextService $estateContextService,
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthenticated');
        }

        // Get the user's current estate from context
        try {
            $estate = $this->estateContextService->getEstate();
        } catch (\Exception $e) {
            abort(403, 'No estate access');
        }

        if (! $estate) {
            abort(403, 'No estate access');
        }

        // Verify user has accepted membership in this estate
        $membership = $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $estate->id)
            ->first();

        if (! $membership) {
            abort(403, 'No access to this estate');
        }

        // Verify user has appropriate role for the route prefix
        $this->validateUserRoleForRoute($user, $estate, $request);

        // Bind estate to request attributes for use in controllers
        $request->attributes->set('estate', $estate);

        // If request has estate_id parameter, validate it matches context
        if ($request->has('estate_id') && $request->input('estate_id') != $estate->id) {
            abort(403, 'Estate ID mismatch. You cannot perform actions for another estate.');
        }

        return $next($request);
    }

    /**
     * Basic role validation based on route path prefixes.
     */
    private function validateUserRoleForRoute($user, $estate, Request $request): void
    {
        $path = $request->path();

        // Admin routes require admin role on this estate
        if (str_starts_with($path, 'admin/')) {
            if (! $user->hasRole('admin', $estate->id)) {
                abort(403, 'Admin role required for this estate context.');
            }
        }

        // Resident routes require resident role on this estate
        if (str_starts_with($path, 'resident/')) {
            if (! $user->hasRole('resident', $estate->id)) {
                abort(403, 'Resident role required for this estate context.');
            }
        }

        // Security routes require security role on this estate
        if (str_starts_with($path, 'security/')) {
            if (! $user->hasRole('security', $estate->id)) {
                abort(403, 'Security role required for this estate context.');
            }
        }
    }
}
