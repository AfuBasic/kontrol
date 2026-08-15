<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Events\Admin\UserCreated;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

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
                    'password' => null,
                ]
            );

            // 2. Attach to Estate if not already attached
            if (! $user->estates()->where('estates.id', $estate->id)->exists()) {
                $user->estates()->attach($estate->id, ['status' => 'pending']);
            }

            // 3. Create authoritative assignment (which dual-writes to Spatie roles)
            $roleModel = Role::where('name', $data['role'])
                        ->where(function ($query) use ($estate) {
                            $query->whereNull('estate_id')->orWhere('estate_id', $estate->id);
                        })
                        ->firstOrFail();

            app(CreateAdministrativeAssignmentAction::class)->execute(
                user: $user,
                estate: $estate,
                role: $roleModel,
                scopeType: AssignmentScope::Estate,
                zone: null,
                isPrimary: false,
                isActive: true
            );

            // 4. Dispatch event (handles email invitation and realtime notification)
            if ($user->password === null) {
                DB::afterCommit(function () use ($user, $estate) {
                    event(new UserCreated($user, $estate));
                });
            }

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('invited admin '.$user->email);

            return $user;
        });
    }
}
