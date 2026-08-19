<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\EstablishDeviceTrust;
use App\Models\User;
use Exception;
use Google\Client as GoogleClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
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
        EstablishDeviceTrust $establishDeviceTrust,
        AuthenticateUser $authenticateUser,
    ): RedirectResponse {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Exception $e) {
            return redirect()->route('login')->with('error', 'Google authentication failed.');
        }

        return $this->authenticateSocialUser($googleUser, $request, $establishDeviceTrust, $authenticateUser);
    }

    /**
     * Handle Google Sign-in from mobile app via token.
     */
    public function handleGoogleMobileToken(
        Request $request,
        EstablishDeviceTrust $establishDeviceTrust,
        AuthenticateUser $authenticateUser,
    ): RedirectResponse {
        $request->validate(['token' => 'required|string']);

        try {
            // Verify the ID token against all whitelisted audiences (Web, iOS, Android)
            $client = new GoogleClient;
            $audiences = array_filter(array_merge(
                [config('services.google.client_id')],
                config('services.google.mobile_ids', [])
            ));

            $payload = $client->verifyIdToken($request->token);

            // Double check: If the token is valid but was generated for an audience we trust
            if (! $payload || ! in_array($payload['aud'], $audiences)) {
                throw new Exception('Identity verification failed. Invalid audience: '.($payload['aud'] ?? 'unknown'));
            }

            // Map Google payload to a compatible User object for authenticateSocialUser
            $googleUser = new class($payload)
            {
                public function __construct(public array $payload) {}

                public function getEmail()
                {
                    return $this->payload['email'];
                }

                public function getId()
                {
                    return $this->payload['sub'];
                }
            };

        } catch (Exception $e) {
            Log::error('Google Mobile Token Verification Failed: '.$e->getMessage());

            return redirect()->route('login')->with('error', 'Google token verification failed: '.$e->getMessage());
        }

        return $this->authenticateSocialUser($googleUser, $request, $establishDeviceTrust, $authenticateUser);
    }

    /**
     * Common authentication logic for social users.
     */
    private function authenticateSocialUser(
        $googleUser,
        Request $request,
        EstablishDeviceTrust $establishDeviceTrust,
        AuthenticateUser $authenticateUser,
    ): RedirectResponse {
        $user = User::where('email', $googleUser->getEmail())->first();

        if (! $user) {
            $email = $googleUser->getEmail();

            return redirect()->route('login')->with('error', "No account found for {$email}. Google sign up is not permitted. Please contact your estate administrator to get onboarded.");
        }

        if (! $user->google_id || ! $user->email_verified_at) {
            $user->update([
                'google_id' => $user->google_id ?? $googleUser->getId(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]);
        }

        try {
            $authenticateUser->validate($user->email);
        } catch (ValidationException $e) {
            $message = collect($e->errors())->flatten()->first();

            return redirect()->route('login')->with('error', $message);
        }

        return $establishDeviceTrust->execute($user, $request, remember: true);
    }
}
