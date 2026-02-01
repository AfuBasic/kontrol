<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UpdateUserAction
{
    /**
     * @param  array{name: string, email: string, role?: string}  $data
     */
    public function execute(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            if (isset($data['role'])) {
                // Ensure estate context is set by the controller before calling this,
                // or rely on setPermissionsTeamId called previously in the request lifecycle.
                $user->syncRoles([$data['role']]);
            }

            return $user;
        });
    }
}
