<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
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
    public function handleGoogleCallback(): RedirectResponse
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

        // Redirect based on role
        if ($user->hasRole('resident')) {
            return redirect()->route('resident.home');
        }

        if ($user->hasRole('security')) {
            return redirect()->route('security.dashboard');
        }

        return redirect()->route('admin.dashboard');
    }
}
