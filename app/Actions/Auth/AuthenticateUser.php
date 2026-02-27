<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthenticateUser
{
    /**
     * Validate credentials and return the user without logging in.
     *
     * @throws ValidationException
     */
    public function validate(string $email, string $password): User
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! $user->password || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->suspended_at) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact the administrator.'],
            ]);
        }

        $hasAcceptedMembership = $user->estates()
            ->wherePivot('status', 'accepted')
            ->exists();

        if (! $hasAcceptedMembership) {
            throw ValidationException::withMessages([
                'email' => ['Your account is not yet activated. Please check your email for an invitation.'],
            ]);
        }

        return $user;
    }

    /**
     * Validate credentials, log the user in, and log the activity.
     *
     * @throws ValidationException
     */
    public function execute(string $email, string $password, bool $remember = false): User
    {
        $user = $this->validate($email, $password);

        Auth::login($user, $remember);

        $this->logActivity($user);

        return $user;
    }

    /**
     * Log a successful login activity with device information.
     */
    public function logActivity(User $user): void
    {
        $request = request();
        $estateId = $user->estates->first()?->id;

        $properties = [
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'browser' => $this->parseBrowser($request->userAgent() ?? ''),
        ];

        if ($estateId) {
            $properties['estate_id'] = $estateId;
        }

        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties($properties)
            ->log('logged in');
    }

    /**
     * Extract a human-readable browser/device label from a user agent string.
     * Uses the Sec-CH-UA header when available for accurate Chromium-based browser detection.
     */
    private function parseBrowser(string $userAgent): string
    {
        $browser = 'Unknown browser';
        $platform = '';

        $clientHint = request()->header('Sec-CH-UA', '');

        if ($clientHint && preg_match('/Brave/i', $clientHint)) {
            $browser = 'Brave';
        } elseif (preg_match('/Edg\//i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/OPR|Opera/i', $userAgent)) {
            $browser = 'Opera';
        } elseif (preg_match('/Vivaldi/i', $userAgent)) {
            $browser = 'Vivaldi';
        } elseif (preg_match('/SamsungBrowser/i', $userAgent)) {
            $browser = 'Samsung Internet';
        } elseif (preg_match('/Chrome/i', $userAgent) && ! preg_match('/Edg|OPR/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Safari/i', $userAgent) && ! preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Firefox/i', $userAgent)) {
            $browser = 'Firefox';
        }

        if (preg_match('/Windows/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/Macintosh|Mac OS/i', $userAgent)) {
            $platform = 'Mac';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $platform = 'Android';
        } elseif (preg_match('/iPhone|iPad/i', $userAgent)) {
            $platform = 'iOS';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $platform = 'Linux';
        }

        return $platform ? "{$browser} on {$platform}" : $browser;
    }
}
