<?php

namespace App\Http\Middleware;

use App\Models\EstateSettings;
use App\Services\EstateContextService;
use App\Services\Security\CheckpointClaimService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureCheckpointSelected
{
    public function __construct(
        protected EstateContextService $estateContextService,
        protected CheckpointClaimService $checkpointClaimService
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
            return $next($request);
        }

        try {
            $estate = $this->estateContextService->getEstate();
        } catch (\Throwable) {
            return $next($request);
        }

        $settings = EstateSettings::forEstate($estate->id);

        if (! $settings->entry_point_checkout_enforced) {
            return $next($request);
        }

        // Exclude the checkpoint selection routes to avoid redirect loops
        if ($request->routeIs('security.checkpoint.*')) {
            return $next($request);
        }

        $activeCheckpoint = $this->checkpointClaimService->getCurrentCheckpoint($estate->id, $user);

        if (! $activeCheckpoint) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'An active entry point checkpoint must be claimed before performing security actions.',
                    'redirect' => route('security.checkpoint.select'),
                ], 428);
            }

            return redirect()->route('security.checkpoint.select');
        }

        // Refresh lock TTL on active request
        $this->checkpointClaimService->refresh($estate->id, $user);

        // Share active checkpoint with Inertia
        Inertia::share('activeCheckpoint', $activeCheckpoint);

        return $next($request);
    }
}
