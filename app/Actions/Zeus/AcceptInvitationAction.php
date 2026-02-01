<?php

namespace App\Actions\Zeus;

use App\Models\User;
use App\Notifications\Admin\ResidentAcceptedInvitation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AcceptInvitationAction
{
    /**
     * @param  array{password: string, password_reset?: bool}  $data
     */
    public function execute(User $user, array $data): void
    {
        DB::transaction(function () use ($user, $data) {
            // Set the user's password
            $user->update([
                'password' => Hash::make($data['password']),
            ]);

            // Update pivot status to accepted
            DB::table('estate_users_membership')
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->update(['status' => 'accepted']);

            $user->estates()->update(['estates.status' => 'active']);

            // Notify Estate Admins
            $estate = $user->estates()->first();
            $isPasswordReset = $data['password_reset'] ?? false;

            if ($estate) {
                setPermissionsTeamId($estate->id);
                $user->unsetRelation('roles');

                if ($user->hasRole(['resident', 'security'])) {
                    DB::afterCommit(function () use ($user, $estate, $isPasswordReset) {
                        User::withRole('admin', $estate->id)
                            ->get()
                            ->each(fn ($admin) => $admin->notify(new ResidentAcceptedInvitation($user, $isPasswordReset)));
                    });
                }

                activity()
                    ->performedOn($user)
                    ->causedBy($user)
                    ->withProperties(['estate_id' => $estate->id])
                    ->log('accepted invitation');
            }
        });
    }
}
