<?php

namespace App\Support;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Throwable;

class IntendedDestinationGuard
{
    /**
     * Determine whether the active context can open a stored intended URL.
     */
    public function allows(User $user, ?string $destination): bool
    {
        if (! is_string($destination) || $destination === '') {
            return false;
        }

        $path = parse_url($destination, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return true;
        }

        $normalizedPath = trim($path, '/');
        $routeDecision = $this->allowsByRouteMiddleware($user, $normalizedPath);

        if ($routeDecision !== null) {
            return $routeDecision;
        }

        return match (true) {
            $normalizedPath === 'resident/billing',
            str_starts_with($normalizedPath, 'resident/billing/'),
            $normalizedPath === 'resident/coupons',
            str_starts_with($normalizedPath, 'resident/coupons/') => $user->contextHasRole(['resident', 'property_owner']),
            default => true,
        };
    }

    /**
     * Find a valid assignment for the user that matches the intended destination URL.
     */
    public function matchAssignment(User $user, ?string $destination): ?AdministrativeAssignment
    {
        if (! is_string($destination) || $destination === '') {
            return null;
        }

        $path = parse_url($destination, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return null;
        }

        $normalizedPath = trim($path, '/');
        $validAssignments = app(ContextManager::class)->getValidAssignments($user);

        if ($validAssignments->isEmpty()) {
            return null;
        }

        // Specific matching for resident billing / coupons
        if (
            $normalizedPath === 'resident/billing' ||
            str_starts_with($normalizedPath, 'resident/billing/') ||
            $normalizedPath === 'resident/coupons' ||
            str_starts_with($normalizedPath, 'resident/coupons/')
        ) {
            $matching = $validAssignments->filter(function (AdministrativeAssignment $assignment) {
                return $assignment->role && in_array($assignment->role->name, ['resident', 'property_owner'], true);
            });

            return $matching->count() === 1 ? $matching->first() : $matching->firstWhere('is_primary', true) ?? $matching->first();
        }

        // General Resident Portal routes
        if (str_starts_with($normalizedPath, 'resident/')) {
            $matching = $validAssignments->filter(function (AdministrativeAssignment $assignment) {
                return $assignment->role && in_array($assignment->role->name, ['resident', 'property_owner', 'household_member'], true);
            });

            return $matching->count() === 1 ? $matching->first() : $matching->firstWhere('is_primary', true) ?? $matching->first();
        }

        // Admin Portal routes
        if (str_starts_with($normalizedPath, 'admin/')) {
            $matching = $validAssignments->filter(function (AdministrativeAssignment $assignment) {
                return $assignment->role && $assignment->role->name === 'admin';
            });

            return $matching->count() === 1 ? $matching->first() : $matching->firstWhere('is_primary', true) ?? $matching->first();
        }

        // Security Portal routes
        if (str_starts_with($normalizedPath, 'security/')) {
            $matching = $validAssignments->filter(function (AdministrativeAssignment $assignment) {
                return $assignment->role && $assignment->role->name === 'security';
            });

            return $matching->count() === 1 ? $matching->first() : $matching->firstWhere('is_primary', true) ?? $matching->first();
        }

        return null;
    }

    private function allowsByRouteMiddleware(User $user, string $normalizedPath): ?bool
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST)
            ?: config('domains.app')
            ?: 'localhost';

        try {
            $request = Request::create('/'.$normalizedPath, 'GET', [], [], [], [
                'HTTP_HOST' => $host,
            ]);
            $route = app('router')->getRoutes()->match($request);
        } catch (Throwable) {
            return null;
        }

        foreach ($route->gatherMiddleware() as $middleware) {
            if (! is_string($middleware) || ! str_starts_with($middleware, 'role:')) {
                continue;
            }

            $roles = array_values(array_filter(array_map(
                fn (string $role): string => trim($role),
                explode(',', substr($middleware, strlen('role:')))
            )));

            return $roles === [] || $user->contextHasRole($roles);
        }

        return true;
    }
}
