<?php

namespace App\Http\Controllers\Auth;

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
    public function redirectToGoogle(Request $request): RedirectResponse
    {
        // Store PWA flag so we know to redirect through bridge page after callback
        if ($request->has('pwa')) {
            session(['oauth_from_pwa' => true]);
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google callback.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Google authentication failed.');
        }

        // Find or create user by email
        $user = User::where('email', $googleUser->getEmail())->first();

        if (! $user) {
            // User doesn't exist - redirect back with error
            return redirect()->route('login')->with('error', 'No account found with this email. Please contact your administrator.');
        }

        // Update Google ID if not set
        if (! $user->google_id) {
            $user->update(['google_id' => $googleUser->getId()]);
        }

        Auth::login($user, true);

        // Determine the redirect URL based on role
        $redirectUrl = $this->getRedirectUrl($user);

        // If login was initiated from PWA, show bridge page
        if (session()->pull('oauth_from_pwa')) {
            return redirect()->route('auth.pwa-bridge', ['redirect' => $redirectUrl]);
        }

        return redirect($redirectUrl);
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
