<?php

namespace App\Http\Middleware;

use App\Services\OrganizationContextService;
use Closure;
use Exception;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrganizationMembership
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $requiredRole = null): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated');
        }

        try {
            $organization = $this->contextService->getOrganization();
            $membership = $this->contextService->getMembership();
        } catch (Exception $e) {
            abort(403, 'No active organization access.');
        }

        if ($requiredRole === 'admin' && ! $membership->isAdmin()) {
            abort(403, 'Organization administrator access required.');
        }

        // Bind to request attributes for easy controller access
        $request->attributes->set('organization', $organization);
        $request->attributes->set('organization_membership', $membership);

        return $next($request);
    }
}
