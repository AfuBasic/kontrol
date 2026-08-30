<?php

namespace App\Http\Middleware\Zeus;

use App\Models\AdministrativeAssignment;
use App\Models\User;
use App\Services\Zeus\ImpersonationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockSensitiveDuringImpersonation
{
    public function __construct(
        private ImpersonationService $impersonationService,
    ) {}

    /**
     * Handle an incoming request and block sensitive security actions during Support Mode.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->impersonationService->isImpersonating($request)) {
            return $next($request);
        }

        $effectiveUser = $this->impersonationService->getEffectiveUser($request);
        $routeName = (string) ($request->route()?->getName() ?? '');

        // 1. Block password / credential modifications
        if (str_contains($routeName, 'password') && ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH'))) {
            abort(403, 'Password and security credential modifications are restricted during Support Mode.');
        }

        // 2. Block deleting or revoking the effective administrator's own account or assignment
        if ($request->isMethod('DELETE') || str_contains($routeName, 'destroy') || str_contains($routeName, 'deactivate')) {
            $userParam = $request->route('user');
            if ($userParam && $effectiveUser) {
                $targetUserId = $userParam instanceof User ? $userParam->id : (is_numeric($userParam) ? (int) $userParam : null);
                if ($targetUserId === $effectiveUser->id) {
                    abort(403, 'Modifying or deleting the effective administrator account is restricted during Support Mode.');
                }
            }

            $assignmentParam = $request->route('assignment') ?? $request->route('administrativeAssignment');
            if ($assignmentParam && $effectiveUser) {
                $assignment = $assignmentParam instanceof AdministrativeAssignment
                    ? $assignmentParam
                    : AdministrativeAssignment::find($assignmentParam);

                if ($assignment && $assignment->user_id === $effectiveUser->id) {
                    abort(403, 'Modifying or revoking the active administrator assignment is restricted during Support Mode.');
                }
            }
        }

        return $next($request);
    }
}
