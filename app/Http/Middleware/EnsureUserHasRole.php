<?php

namespace App\Http\Middleware;

use App\Actions\Auth\DetermineUserRedirect;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function __construct(
        protected DetermineUserRedirect $determineRedirect
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  The roles allowed to access this route
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect('/login');
        }

        // Check if user has any of the allowed roles
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        // User doesn't have the required role - redirect to their appropriate module
        $correctRedirect = $this->determineRedirect->execute($user);
        $currentPath = '/'.ltrim($request->path(), '/');

        // Prevent redirect loop: if we would redirect to the same path, show 403 instead
        if ($correctRedirect === $currentPath) {
            abort(403, 'You do not have permission to access this resource.');
        }

        return redirect($correctRedirect);
    }
}
