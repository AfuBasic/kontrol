<?php

namespace App\Actions\Admin;

use App\Actions\Invitation\CreateInvitationAction;
use App\Events\Admin\ResidentCreated;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class ResendResidentInvitationAction
{
    public function execute(User $resident, Estate $estate): void
    {
        // 1. Reset verification status if they need a new invite
        $resident->update([
            'password' => null,
            'email_verified_at' => null,
        ]);

        // 2. Ensure an invitation record exists in the database
        $invitation = Invitation::withoutGlobalScopes()
            ->where('email', strtolower(trim($resident->email)))
            ->where('estate_id', $estate->id)
            ->first();

        if (! $invitation) {
            $role = $resident->roles()->where('roles.estate_id', $estate->id)->first()
                ?? Role::where('name', 'resident')->first();

            $zoneId = $resident->profile?->zone_id;

            $invitation = app(CreateInvitationAction::class)->execute(
                email: $resident->email,
                estate: $estate,
                relationshipType: 'resident',
                role: $role,
                zoneId: $zoneId,
                scopeType: $zoneId ? 'zone' : 'estate',
                createdBy: Auth::user()
            );

            DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->where('user_id', $resident->id)
                ->update([
                    'invitation_id' => $invitation->id,
                ]);
        }

        // 3. We DO NOT change the pivot status to pending here.
        // This keeps the resident as "accepted" in the estate, so they don't
        // reappear in the "Pending Applications" list, while their null
        // email_verified_at will naturally show them as "Inactive" in the UI.

        // 3. Resend invitation email
        event(new ResidentCreated($resident, $estate, true));

        // 4. Update resend invitation metadata
        DB::table('estate_users_membership')
            ->where('estate_id', $estate->id)
            ->where('user_id', $resident->id)
            ->update([
                'last_invited_by' => Auth::id(),
                'last_invited_at' => now(),
            ]);

        activity()
            ->performedOn($resident)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('reset password for resident '.$resident->email);
    }
}
