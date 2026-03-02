<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class ResetPassword
{
    /**
     * Reset the user's password using the broker token.
     * Returns the broker status string.
     */
    public function execute(array $credentials): string
    {
        return Password::reset($credentials, function (User $user, string $password): void {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));

            activity()
                ->performedOn($user)
                ->causedBy($user)
                ->log('reset password via forgot password');
        });
    }
}
