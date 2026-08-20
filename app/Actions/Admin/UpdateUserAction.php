<?php

namespace App\Actions\Admin;

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

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
                $roleModel = Role::where('name', $data['role'])
                    ->where(function ($query) use ($estate) {
                        $query->whereNull('estate_id')->orWhere('estate_id', $estate->id);
                    })
                    ->firstOrFail();

                // Find active administrative assignment for this user in this estate
                $assignment = AdministrativeAssignment::where('user_id', $user->id)
                    ->where('estate_id', $estate->id)
                    ->first();

                if ($assignment) {
                    app(UpdateAdministrativeAssignmentAction::class)->execute($assignment, [
                        'role_id' => $roleModel->id,
                    ]);
                } else {
                    app(CreateAdministrativeAssignmentAction::class)->execute(
                        user: $user,
                        estate: $estate,
                        role: $roleModel,
                        scopeType: AssignmentScope::Estate,
                        zone: null,
                        isPrimary: false,
                        isActive: true
                    );
                }
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
