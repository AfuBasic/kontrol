<?php

namespace App\Actions\Auth;

use Illuminate\Support\Facades\Password;

class SendPasswordResetLink
{
    /**
     * Send a password reset link to the given email.
     * Returns the broker status string.
     */
    public function execute(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }
}
