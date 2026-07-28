<?php

namespace App\Http\Middleware;

use App\Services\Platform\PlatformAccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforcePlatformPolicy
{
    public function __construct(
        protected PlatformAccessService $accessService
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $result = $this->accessService->evaluate($request, $user);

            if (! $result->allowed && $result->redirectUrl) {
                return redirect($result->redirectUrl);
            }
        }

        return $next($request);
    }
}
