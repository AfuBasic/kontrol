<?php

namespace App\Services\Platform;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlatformAccessService
{
    public function __construct(
        protected PlatformDetectionService $detectionService,
        protected RolePlatformPolicy $policy
    ) {}

    /**
     * Evaluate incoming request and user for platform access.
     */
    public function evaluate(Request $request, User $user): PlatformAccessResult
    {
        $context = $this->detectionService->detect($request);

        // 1. Check if route is exempt from platform policy (e.g. web collection payments)
        if ($this->isExemptRoute($request)) {
            return PlatformAccessResult::allow($context);
        }

        // 2. Evaluate access against role platform policy
        if ($this->policy->isAllowed($user, $context)) {
            return PlatformAccessResult::allow($context);
        }

        // 3. Denied - determine target redirect experience
        $redirectUrl = $this->policy->getRedirectDestination($user, $context);
        $reason = "Access restricted for role category '{$this->policy->getCategoryForUser($user)}' on current platform.";

        return PlatformAccessResult::deny($reason, $redirectUrl, $context);
    }

    /**
     * Determine if current request path is exempt from restrictions.
     */
    protected function isExemptRoute(Request $request): bool
    {
        // Check explicit bypass flags (header or query param)
        if ($request->has('bypass_mobile_restrict') || $request->header('X-Bypass-Mobile-Restrict') === 'true') {
            return true;
        }

        $exemptPatterns = config('platform.exempt_routes', []);
        $path = $request->path();

        foreach ($exemptPatterns as $pattern) {
            if (Str::is($pattern, $path)) {
                return true;
            }
        }

        return false;
    }
}
