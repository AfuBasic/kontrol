<?php

namespace App\Support;

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
