<?php

namespace App\Actions\Auth;

use App\Events\ForceLogout;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Services\Security\DeviceTrustCookie;
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

        $redirect = redirect()->intended($this->activateContext->execute($user));

        if ($plainTextToken) {
            $redirect->cookie($this->deviceTrustCookie->make($plainTextToken));
        }

        return $redirect;
    }

    public function cookie(string $plainTextToken): SymfonyCookie
    {
        return $this->deviceTrustCookie->make($plainTextToken);
    }
}
