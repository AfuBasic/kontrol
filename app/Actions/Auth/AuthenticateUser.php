<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthenticateUser
{
    /**
     * Validate that the user may begin (or complete) login.
     *
     * @throws ValidationException
     */
    public function validate(string $email): User
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['We could not find an account with that email address.'],
            ]);
        }

        $this->ensureCanLogin($user);

        return $user;
    }

    /**
     * Re-check a loaded user before completing login (e.g. after OTP).
     *
     * @throws ValidationException
     */
    public function ensureCanLogin(User $user): void
    {
        // Suspended accounts must never see "not activated" or other messaging.
        if ($user->suspended_at !== null) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Your email address is not verified. Please check your inbox for the verification link.'],
            ]);
        }

        // Partner portal members are not attached to estates.
        if ($user->user_type === 'affiliate' || $user->partner_id) {
            $this->ensurePartnerMemberCanLogin($user);

            return;
        }

        $memberships = $user->estates()->get();

        if ($memberships->isEmpty()) {
            throw ValidationException::withMessages([
                'email' => ['Your account is not yet activated. Please check your email for an invitation.'],
            ]);
        }

        $hasAcceptedMembership = $memberships->contains(fn ($estate) => $estate->pivot->status === 'accepted');

        if (! $hasAcceptedMembership) {
            $hasPendingMembership = $memberships->contains(fn ($estate) => $estate->pivot->status === 'pending');

            if ($hasPendingMembership) {
                throw ValidationException::withMessages([
                    'email' => ['Your account is currently awaiting approval from the estate administrator.'],
                ]);
            }

            throw ValidationException::withMessages([
                'email' => ['Your account is not yet activated. Please check your email for an invitation.'],
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function ensurePartnerMemberCanLogin(User $user): void
    {
        $partner = $user->partner;

        if (! $partner) {
            throw ValidationException::withMessages([
                'email' => ['Your partner account is not linked. Please contact support.'],
            ]);
        }

        match ($partner->status) {
            'suspended' => throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact support.'],
            ]),
            'pending' => throw ValidationException::withMessages([
                'email' => ['Your account is not yet activated. Please check your email for an invitation.'],
            ]),
            'inactive' => throw ValidationException::withMessages([
                'email' => ['Your account is inactive. Please contact support.'],
            ]),
            'active' => null,
            default => throw ValidationException::withMessages([
                'email' => ['Your account cannot sign in right now. Please contact support.'],
            ]),
        };
    }

    /**
     * Validate credentials, log the user in, and log the activity.
     *
     * @throws ValidationException
     */
    public function execute(string $email, bool $remember = false): User
    {
        $user = $this->validate($email);

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
