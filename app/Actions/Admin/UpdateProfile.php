<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdateProfile
{
    /**
     * Update the user's profile information.
     *
     * @param  array{name: string, password?: string}  $data
     */
    public function execute(User $user, array $data): User
    {
        $updateData = ['name' => $data['name']];

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        return $user->fresh();
    }
}
