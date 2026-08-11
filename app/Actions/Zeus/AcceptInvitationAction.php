<?php

namespace App\Actions\Zeus;

use App\Models\User;
use App\Notifications\Admin\PropertyOwnerResidentJoinedAdminNotification;
use App\Notifications\Admin\ResidentAcceptedInvitation;
use App\Notifications\PropertyOwner\ResidentAcceptedToPropertyOwner;
use App\Services\ResidentSubscriptionService;
use Illuminate\Support\Facades\DB;

class AcceptInvitationAction
{
    public function execute(User $user, array $data = []): void
    {
        DB::transaction(function () use ($user, $data) {
            // Verify email
            $user->update([
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]);

            if ($user->partner_id) {
                $user->partner()->update(['status' => 'active']);
            }

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
                $assignment = \App\Models\AdministrativeAssignment::with('role')
                    ->where('user_id', $user->id)
                    ->where('estate_id', $estate->id)
                    ->where('is_active', true)
                    ->first();
                $roleName = $assignment?->role?->name;

                if (in_array($roleName, ['resident', 'security', 'household_member'])) {
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
