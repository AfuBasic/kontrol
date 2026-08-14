<?php

namespace App\Http\Middleware;

use App\Auth\ContextManager;
use App\Services\EstateContextService;
use Closure;
use Exception;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response;

class ValidateEstateContext
{
    public function __construct(
        private EstateContextService $estateContextService,
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
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
        } catch (Exception $e) {
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

        // Verify context matches the required route prefix
        $this->validateUserRoleForRoute($request);

        // Bind estate to request attributes for use in controllers
        $request->attributes->set('estate', $estate);

        // If request has estate_id parameter, validate it matches context
        if ($request->has('estate_id') && $request->input('estate_id') != $estate->id) {
            abort(403, 'Estate ID mismatch. You cannot perform actions for another estate.');
        }

        return $next($request);
    }

    /**
     * Validate the active context against the requested route.
     */
    private function validateUserRoleForRoute($request): void
    {
        $path = $request->path();
        $context = app(ContextManager::class)->current();

        if (! $context) {
            abort(403, 'No active context');
        }

        $role = Role::find($context->roleId);
        $roleName = strtolower($role ? $role->name : '');

        // Admin routes require an admin-like role in the active context
        if (str_starts_with($path, 'admin/')) {
            if (! str_contains($roleName, 'admin')) {
                abort(403, 'Admin context required for this route.');
            }
        }

        // Resident routes require a resident-like role in the active context
        if (str_starts_with($path, 'resident/')) {
            if (! str_contains($roleName, 'resident') && ! str_contains($roleName, 'household')) {
                abort(403, 'Resident context required for this route.');
            }
        }

        // Security routes require a security role in the active context
        if (str_starts_with($path, 'security/')) {
            if (! str_contains($roleName, 'security')) {
                abort(403, 'Security context required for this route.');
            }
        }
    }
}
