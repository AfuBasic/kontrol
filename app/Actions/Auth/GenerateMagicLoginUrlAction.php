<?php

namespace App\Actions\Auth;

use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class GenerateMagicLoginUrlAction
{
    /**
     * Generate a one-time-use magic login URL for a user.
     *
     * @param  User  $user  The user to authenticate
     * @param  string|null  $destination  The relative path to redirect to after login
     * @param  int  $ttlMinutes  Time to live in minutes (default 5)
     */
    public function execute(User $user, ?string $destination = null, int $ttlMinutes = 5): string
    {
        // Generate a cryptographically secure random token
        $token = Str::random(64);

        // Store the token (plain text for simplicity since it's short-lived and one-time use,
        // similar to a signed URL parameter but with database enforcement)
        MagicLoginToken::create([
            'user_id' => $user->id,
            'token' => $token,
            'destination_url' => $destination,
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);

        // Generate a signed URL for extra security
        return URL::temporarySignedRoute(
            'auth.magic-login',
            now()->addMinutes($ttlMinutes),
            ['token' => $token]
        );
    }
}
