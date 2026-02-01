<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthenticateUser
{
    /**
     * Authenticate a user and log them in.
     *
     * @throws ValidationException
     */
    public function execute(string $email, string $password, bool $remember = false): User
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

        // Check if user has accepted their invitation (has at least one accepted estate membership)
        $hasAcceptedMembership = $user->estates()
            ->wherePivot('status', 'accepted')
            ->exists();

        if (! $hasAcceptedMembership) {
            throw ValidationException::withMessages([
                'email' => ['Your account is not yet activated. Please check your email for an invitation.'],
            ]);
        }

        Auth::login($user, $remember);

        // Try to get estate context if available
        $estateId = $user->estates->first()?->id;

        $logger = activity()
            ->performedOn($user)
            ->causedBy($user);

        if ($estateId) {
            $logger->withProperties(['estate_id' => $estateId])->save();
        }
        $logger->log('logged in');

        return $user;
    }
}
