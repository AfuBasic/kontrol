<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Auth\ContextManager;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UpdateUserAction
{
    /**
     * @param  array{name: string, email: string, role?: string}  $data
     */
    public function execute(User $user, array $data, Estate $estate): User
    {
        return DB::transaction(function () use ($user, $data, $estate) {
            $user->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            if (isset($data['role'])) {
                // Ensure estate context is set
                app(ContextManager::class)->setSystemContext($estate->id);
                $user->syncRoles([$data['role']]);
            }

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('updated admin '.$user->name);

            return $user;
        });
    }
}
