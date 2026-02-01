<?php

namespace App\Actions\Admin;

use App\Events\Admin\UserCreated;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateUserAction
{
    /**
     * @param  array{name: string, email: string, role: string}  $data
     */
    public function execute(array $data, Estate $estate): User
    {
        return DB::transaction(function () use ($data, $estate) {
            // 1. Check if user exists or create new one
            $user = User::create(
                [
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => NULL, 
                ]
            );

            // 2. Attach to Estate if not already attached
            if (! $user->estates()->where('estates.id', $estate->id)->exists()) {
                $user->estates()->attach($estate->id, ['status' => 'pending']);
            }

            // 3. Assign Role scoped to this estate
            setPermissionsTeamId($estate->id);
            
            if (! $user->hasRole($data['role'])) {
                $user->assignRole($data['role']);
            }

            // 4. Dispatch event (handles email invitation and realtime notification)
            if ($user->password === NULL) {
                DB::afterCommit(function () use ($user, $estate) {
                    event(new UserCreated($user, $estate));
                });
            }

            return $user;
        });
    }
}
