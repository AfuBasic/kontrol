<?php

namespace App\Http\Middleware;

use App\Services\OrganizationContextService;
use Closure;
use Exception;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanManageResidentBilling
{
    public function __construct(
        private OrganizationContextService $orgContextService,
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
            return redirect('/login');
        }

        if ($user->contextHasRole(['resident', 'property_owner'])) {
            return $next($request);
        }

        try {
            $org = $this->orgContextService->getOrganization();
            if ($org && $org->is_active) {
                return $next($request);
            }
        } catch (Exception) {
            // No organization context available
        }

        abort(403, 'You do not have permission to manage billing.');
    }
}
