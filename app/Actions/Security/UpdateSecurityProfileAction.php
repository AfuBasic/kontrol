<?php

namespace App\Actions\Security;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdateSecurityProfileAction
{
    /**
     * Update security user's profile.
     *
     * @param  array{name?: string, password?: string}  $data
     */
    public function execute(User $user, array $data): User
    {
        $updates = [];

        if (isset($data['name'])) {
            $updates['name'] = $data['name'];
        }

        if (isset($data['password']) && $data['password'] !== '') {
            $updates['password'] = Hash::make($data['password']);
        }

        if (! empty($updates)) {
            $user->update($updates);
        }

        return $user->fresh();
    }
}
