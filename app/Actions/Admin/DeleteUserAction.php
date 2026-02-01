<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeleteUserAction
{
    public function execute(User $user, Estate $estate): void
    {
        DB::transaction(function () use ($user, $estate) {
            // Detach all roles for this estate
            setPermissionsTeamId($estate->id);
            $user->syncRoles([]);

            // Detach from estate key membership
            $user->estates()->detach($estate->id);

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('removed admin ' . $user->name);

            // If user has no other estates and no password (invite pending), maybe delete entirely?
            // For now, let's keep it safe and just detach.
            // But if they are purely a new invite for this estate, might be cleaner to delete.
            if ($user->estates()->count() === 0 && $user->password === null) {
                $user->delete();
            }
        });
    }
}
