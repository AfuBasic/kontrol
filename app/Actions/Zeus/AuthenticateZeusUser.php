<?php

namespace App\Actions\Zeus;

use Illuminate\Support\Facades\Hash;

class AuthenticateZeusUser
{
    public function execute(string $username, string $password): bool
    {
        $configuredUsername = config('zeus.username');
        $configuredPassword = Hash::make(config('zeus.password'));

        if (! $configuredUsername || ! $configuredPassword) {
            return false;
        }

        if ($username !== $configuredUsername) {
            return false;
        }

        if (! Hash::check($password, $configuredPassword)) {
            return false;
        }

        return true;
    }
}
