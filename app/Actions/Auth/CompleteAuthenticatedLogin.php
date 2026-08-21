<?php

namespace App\Actions\Auth;

use App\Events\ForceLogout;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Services\Security\DeviceTrustCookie;
use App\Support\IntendedDestinationGuard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class CompleteAuthenticatedLogin
{
    public function __construct(
        private ActivateContext $activateContext,
        private AuthenticateUser $authenticateUser,
        private DeviceTrustCookie $deviceTrustCookie,
        private IntendedDestinationGuard $intendedDestinationGuard,
    ) {}

    public function execute(
        User $user,
        Request $request,
        bool $remember = false,
        ?TrustedDevice $device = null,
        ?string $plainTextToken = null,
        bool $forceLogout = true,
    ): RedirectResponse {
        Auth::login($user, $remember);
        $request->session()->regenerate();

        if ($forceLogout) {
            ForceLogout::dispatchSafely($user->id);
        }

        $request->session()->put('password_hash_web', $user->getAuthPassword());

        if ($device) {
            $request->session()->put('trusted_device_id', $device->id);

            $device->forceFill([
                'last_used_at' => now(),
                'last_session_id' => $request->session()->getId(),
                'ip_address' => $request->ip(),
            ])->save();
        }

        $this->authenticateUser->logActivity($user);

        $redirect = redirect()->to($this->destinationAfterLogin($user, $request));

        if ($plainTextToken) {
            $redirect->cookie($this->deviceTrustCookie->make($plainTextToken));
        }

        return $redirect;
    }

    public function cookie(string $plainTextToken): SymfonyCookie
    {
        return $this->deviceTrustCookie->make($plainTextToken);
    }

    /**
     * Prefer an explicit destination only when an estate context is already active.
     * Multi-context users must pick a workspace first; billing and other gated
     * pages 403 without one.
     */
    private function destinationAfterLogin(User $user, Request $request): string
    {
        $defaultDestination = $this->activateContext->execute($user);
        $intended = $request->session()->pull('url.intended');

        if ($defaultDestination === route('context.select')) {
            if (is_string($intended) && $intended !== '') {
                $matchedAssignment = $this->intendedDestinationGuard->matchAssignment($user, $intended);
                if ($matchedAssignment) {
                    $this->activateContext->execute($user, $matchedAssignment);

                    return $intended;
                }

                $request->session()->put('url.intended', $intended);
            }

            return $defaultDestination;
        }

        if ($defaultDestination === url('/')) {
            return $defaultDestination;
        }

        if (is_string($intended) && $intended !== '' && $this->intendedDestinationGuard->allows($user, $intended)) {
            return $intended;
        }

        return $defaultDestination;
    }
}
