<?php

namespace App\Http\Middleware\Zeus;

use App\Auth\ContextManager;
use App\Models\ImpersonationSession;
use App\Services\Zeus\ImpersonationService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResolveImpersonationContext
{
    public function __construct(
        private ImpersonationService $impersonationService,
        private ContextManager $contextManager,
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $sessionId = $request->session()->get(ImpersonationService::SESSION_ID_KEY);

        if (! $sessionId) {
            return $next($request);
        }

        // 1. Invariant: Zeus authentication must still be present in the session
        $isZeusAuthenticated = (bool) $request->session()->get(config('zeus.session_key'));
        if (! $isZeusAuthenticated) {
            $this->terminateSession($request, $sessionId);

            return $next($request);
        }

        // 2. Fetch the active server-authoritative ImpersonationSession
        /** @var ImpersonationSession|null $impersonationSession */
        $impersonationSession = ImpersonationSession::query()
            ->with(['effectiveUser', 'estate'])
            ->where('id', $sessionId)
            ->whereNull('ended_at')
            ->first();

        if (! $impersonationSession || ! $impersonationSession->effectiveUser || ! $impersonationSession->estate) {
            $this->terminateSession($request, $sessionId);

            return $next($request);
        }

        $effectiveUser = $impersonationSession->effectiveUser;
        $estate = $impersonationSession->estate;

        // 3. Invariant: Effective user must still possess legitimate, active administrator authority for this estate
        $assignment = $this->impersonationService->validateTargetAdmin($estate, $effectiveUser);

        if (! $assignment) {
            $this->terminateSession($request, $sessionId);

            if (str_starts_with($request->path(), 'admin')) {
                return redirect()->route('zeus.estates.show', $estate)
                    ->with('error', 'Support Mode session terminated: the administrator authority is no longer valid.');
            }

            return $next($request);
        }

        // 4. Ensure Web Guard is authenticated as the effective user
        $currentUser = Auth::user();
        if (! $currentUser || $currentUser->id !== $effectiveUser->id) {
            Auth::login($effectiveUser);
        }

        // 5. Ensure the active assignment is set to the effective administrator's assignment
        $request->session()->put('active_context_assignment_id', $assignment->id);

        // 6. Bind Support Mode indicators to request attributes for controllers and logging
        $request->attributes->set('is_support_mode', true);
        $request->attributes->set('impersonation_session', $impersonationSession);

        return $next($request);
    }

    /**
     * Safely terminate the impersonation session and clear session identifiers.
     */
    private function terminateSession(Request $request, int|string $sessionId): void
    {
        ImpersonationSession::query()
            ->where('id', $sessionId)
            ->whereNull('ended_at')
            ->update(['ended_at' => now()]);

        $request->session()->forget(ImpersonationService::SESSION_ID_KEY);
        $request->session()->forget(ImpersonationService::ESTATE_ID_KEY);
        $request->session()->forget(ImpersonationService::USER_ID_KEY);
        $request->session()->forget('active_context_assignment_id');

        $this->contextManager->clear();
    }
}
