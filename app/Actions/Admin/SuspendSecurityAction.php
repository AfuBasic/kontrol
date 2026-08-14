<?php

namespace App\Actions\Admin;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class SuspendSecurityAction
{
    public function execute(User $security, Estate $estate): void
    {
        $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();

        if ($securityRole) {
            $assignment = AdministrativeAssignment::where('user_id', $security->id)
                ->where('estate_id', $estate->id)
                ->where('role_id', $securityRole->id)
                ->first();

            if ($assignment) {
                $assignment->update([
                    'is_active' => ! $assignment->is_active,
                ]);

                $isSuspended = ! $assignment->is_active;

                activity()
                    ->performedOn($security)
                    ->causedBy(Auth::user())
                    ->withProperties(['estate_id' => $estate->id, 'is_active' => $assignment->is_active])
                    ->log($isSuspended ? 'suspended security role for '.$security->name : 'activated security role for '.$security->name);
            }
        }
    }
}
