<?php

namespace App\Actions\Zeus;

use App\Auth\ContextManager;
use App\Models\Estate;
use App\Models\ImpersonationSession;
use App\Services\Zeus\ImpersonationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StopImpersonationAction
{
    public function __construct(
        private ContextManager $contextManager,
    ) {}

    /**
     * Stop an active impersonation / Support Mode session.
     */
    public function execute(Request $request): ?Estate
    {
        $sessionId = $request->session()->get(ImpersonationService::SESSION_ID_KEY);
        $estate = null;

        if ($sessionId) {
            $session = ImpersonationSession::with('estate')->find($sessionId);
            if ($session) {
                if ($session->ended_at === null) {
                    $session->update(['ended_at' => now()]);
                }
                $estate = $session->estate;
            }
        }

        // 1. Clear impersonation session state
        $request->session()->forget(ImpersonationService::SESSION_ID_KEY);
        $request->session()->forget(ImpersonationService::ESTATE_ID_KEY);
        $request->session()->forget(ImpersonationService::USER_ID_KEY);
        $request->session()->forget('active_context_assignment_id');

        // 2. Clear ContextManager and Spatie team state
        $this->contextManager->clear();

        // 3. Log out effective user from standard web guard
        Auth::logout();

        // 4. Ensure Zeus provider session remains intact
        $request->session()->put(config('zeus.session_key'), true);

        return $estate;
    }
}
