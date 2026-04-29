<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckEstateFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $featureSlug): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthorized.');
        }

        $estate = $user->estates()->wherePivot('status', 'accepted')->first();

        if (! $estate || ! $estate->hasFeature($featureSlug)) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Feature locked. Upgrade your plan to access this feature.'], 403);
            }
            // For Inertia we could flash a message and redirect, or just abort 403
            abort(403, 'Feature locked. Upgrade your plan to access this feature.');
        }

        return $next($request);
    }
}
