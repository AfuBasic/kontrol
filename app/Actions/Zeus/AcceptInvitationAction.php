<?php

namespace App\Actions\Zeus;

use App\Models\User;
use App\Notifications\Admin\PropertyOwnerResidentJoinedAdminNotification;
use App\Notifications\Admin\ResidentAcceptedInvitation;
use App\Notifications\PropertyOwner\ResidentAcceptedToPropertyOwner;
use App\Services\ResidentSubscriptionService;
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
            // Set the user's password and verify email
            $user->update([
                'password' => Hash::make($data['password']),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]);

            // Update pivot status to accepted
            DB::table('estate_users_membership')
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->update(['status' => 'accepted']);

            $user->estates()->update(['estates.status' => 'active']);

            // Create resident subscriptions for all accepted estates that require them
            $subscriptionService = app(ResidentSubscriptionService::class);
            foreach ($user->estates()->wherePivot('status', 'accepted')->get() as $est) {
                $existingSub = $user->residentSubscription()->where('estate_id', $est->id)->exists();
                if (! $existingSub) {
                    $subscriptionService->createForUser($user, $est);
                }
            }

            // Notify Inviter and/or Estate Admins
            $estate = $user->estates()->first();
            $isPasswordReset = $data['password_reset'] ?? false;

            if ($estate) {
                setPermissionsTeamId($estate->id);
                $user->unsetRelation('roles');

                if ($user->hasRole(['resident', 'security', 'household_member'])) {
                    $profile = $user->profile;
                    $propertyOwnerId = $profile?->property_owner_id;
                    $propertyOwner = $propertyOwnerId ? User::find($propertyOwnerId) : null;

                    DB::afterCommit(function () use ($user, $estate, $isPasswordReset, $propertyOwner) {
                        if ($propertyOwner) {
                            // Notify Property Owner
                            $propertyOwner->notify(new ResidentAcceptedToPropertyOwner($user));

                            // Notify Estate Admins with custom short notification
                            User::withRole('admin', $estate->id)
                                ->get()
                                ->each(fn ($admin) => $admin->notify(new PropertyOwnerResidentJoinedAdminNotification($user, $propertyOwner, $estate->name)));
                        } else {
                            // Fallback to default admin notification
                            User::withRole('admin', $estate->id)
                                ->get()
                                ->each(fn ($admin) => $admin->notify(new ResidentAcceptedInvitation($user, $isPasswordReset)));
                        }
                    });
                }
            }
        });
    }
}
