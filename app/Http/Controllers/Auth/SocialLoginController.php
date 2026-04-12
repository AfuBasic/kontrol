<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\CheckTrustedDevice;
use App\Actions\Auth\GenerateLoginOtp;
use App\Events\ForceLogout;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialLoginController
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google callback.
     */
    public function handleGoogleCallback(
        Request $request,
        CheckTrustedDevice $checkTrustedDevice,
        GenerateLoginOtp $generateOtp,
    ): RedirectResponse {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Google authentication failed.');
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if (! $user) {
            return redirect()->route('login')->with('error', 'No account found with this email. Please contact your administrator.');
        }

        if (! $user->google_id) {
            $user->update(['google_id' => $googleUser->getId()]);
        }

        if (! $checkTrustedDevice->execute($user, $request)) {
            $request->session()->put([
                'otp_user_id' => $user->id,
                'otp_via_social' => true,
            ]);

            $generateOtp->execute($user, $request);

            return redirect()->route('login.otp.show');
        }

        Auth::login($user, true);

        $request->session()->regenerate();
        broadcast(new ForceLogout($user->id));
        $this->storePasswordHashInSession($user);

        $redirectUrl = $this->getRedirectUrl($user);

        return redirect($redirectUrl);
    }

    /**
     * Store the user's password hash in the session to support AuthenticateSession middleware.
     */
    private function storePasswordHashInSession(User $user): void
    {
        session(['password_hash_web' => $user->getAuthPassword()]);
    }

    /**
     * Get the redirect URL based on user role.
     */
    private function getRedirectUrl(User $user): string
    {
        if ($user->hasRole('resident')) {
            return route('resident.home');
        }

        if ($user->hasRole('security')) {
            return route('security.dashboard');
        }

        return route('admin.dashboard');
    }
}
