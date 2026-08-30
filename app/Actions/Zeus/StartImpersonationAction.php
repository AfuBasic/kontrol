<?php

namespace App\Actions\Zeus;

use App\Auth\ContextManager;
use App\Models\Estate;
use App\Models\ImpersonationSession;
use App\Models\User;
use App\Services\Zeus\ImpersonationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class StartImpersonationAction
{
    public function __construct(
        private ImpersonationService $impersonationService,
        private ContextManager $contextManager,
    ) {}

    /**
     * Start an impersonation / Support Mode session.
     *
     * @throws ValidationException
     */
    public function execute(Estate $estate, User $targetUser, Request $request, ?string $reason = null): ImpersonationSession
    {
        // 1. Authoritative validation: Target user must be an active administrator for this specific estate
        $assignment = $this->impersonationService->validateTargetAdmin($estate, $targetUser);

        if (! $assignment) {
            throw ValidationException::withMessages([
                'user_id' => 'The selected user is not an active administrator for this estate.',
            ]);
        }

        // 2. End any lingering active impersonation sessions for this HTTP session
        $existingSessionId = $request->session()->get(ImpersonationService::SESSION_ID_KEY);
        if ($existingSessionId) {
            ImpersonationSession::query()
                ->where('id', $existingSessionId)
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);
        }

        // 3. Create the server-authoritative ImpersonationSession audit record
        $impersonationSession = ImpersonationSession::create([
            'provider_identifier' => (string) config('zeus.username', 'zeus'),
            'effective_user_id' => $targetUser->id,
            'estate_id' => $estate->id,
            'reason' => $reason,
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'started_at' => now(),
        ]);

        // 4. Bind session identifiers
        $request->session()->put(ImpersonationService::SESSION_ID_KEY, $impersonationSession->id);
        $request->session()->put(ImpersonationService::ESTATE_ID_KEY, $estate->id);
        $request->session()->put(ImpersonationService::USER_ID_KEY, $targetUser->id);

        // 5. Establish web authentication as the effective estate administrator
        Auth::login($targetUser);

        // 6. Establish ContextManager authoritative state for the administrator's assignment
        $this->contextManager->activate($assignment);

        return $impersonationSession;
    }
}
