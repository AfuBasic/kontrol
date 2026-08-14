<?php

namespace App\Actions\Invitation;

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Zone;
use App\Notifications\Resident\HouseholdMemberInvitationAcceptedNotification;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class AcceptInvitationAction
{
    /**
     * Accept a pending invitation and associate the user.
     */
    public function execute(Invitation $invitation, User $user): void
    {
        // 1. Validation: Invitation must be pending
        if (! $invitation->isPending()) {
            throw new Exception('This invitation is not valid or has expired.');
        }

        // 2. Validation: User email must match invitation email
        if (strtolower($user->email) !== strtolower($invitation->email)) {
            throw new Exception('This invitation belongs to a different email address.');
        }

        DB::transaction(function () use ($invitation, $user) {
            $estateId = $invitation->estate_id;

            // 1. Attach User to Estate if not already attached
            $membershipExists = DB::table('estate_users_membership')
                ->where('user_id', $user->id)
                ->where('estate_id', $estateId)
                ->exists();

            if (! $membershipExists) {
                // Ensure profile exists
                UserProfile::firstOrCreate(['user_id' => $user->id]);

                DB::table('estate_users_membership')->insert([
                    'user_id' => $user->id,
                    'estate_id' => $estateId,
                    'status' => 'accepted',
                    'zone_id' => $invitation->zone_id,
                    'relationship_type' => $invitation->relationship_type,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            } else {
                // Update existing membership (e.g. if it was pending or needs activating)
                DB::table('estate_users_membership')
                    ->where('user_id', $user->id)
                    ->where('estate_id', $estateId)
                    ->update([
                        'status' => 'accepted',
                        // Optional: update relationship/zone if appropriate based on product semantics
                        'zone_id' => $invitation->zone_id,
                        'relationship_type' => $invitation->relationship_type,
                    ]);
            }

            // 2. Assign Spatie Role / administrative assignment
            $assignmentAction = app(CreateAdministrativeAssignmentAction::class);
            $estate = Estate::find($estateId);
            $zone = $invitation->zone_id ? Zone::find($invitation->zone_id) : null;
            $scopeType = AssignmentScope::tryFrom($invitation->scope_type) ?? AssignmentScope::Estate;
            $zoneIdCoalesced = $zone ? $zone->id : 0;

            $role = null;
            if ($invitation->role_id) {
                $role = Role::find($invitation->role_id);
            } else {
                $roleName = match ($invitation->relationship_type) {
                    'security' => 'security',
                    'resident' => 'resident',
                    'property_owner' => 'property_owner',
                    'household_member' => 'household_member',
                    default => null,
                };
                if ($roleName) {
                    $role = Role::where('name', $roleName)->where('guard_name', 'web')->whereNull('estate_id')->first();
                }
            }

            if ($role && $estate) {
                $assignmentExists = AdministrativeAssignment::where('user_id', $user->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $role->id)
                    ->where('zone_id_coalesced', $zoneIdCoalesced)
                    ->exists();

                if (! $assignmentExists) {
                    $assignmentAction->execute(
                        user: $user,
                        estate: $estate,
                        role: $role,
                        scopeType: $scopeType,
                        zone: $zone,
                        isPrimary: true
                    );
                }
            }

            // 3. Mark invitation as accepted
            $invitation->update([
                'status' => 'accepted',
                'accepted_at' => Carbon::now(),
            ]);

            // Activate the estate if it was inactive or pending and this is an estate-scoped invitation (usually the initial admin invite)
            if ($estate && in_array($estate->status, ['inactive', 'pending']) && $invitation->scope_type === AssignmentScope::Estate->value) {
                $estate->update([
                    'status' => 'active',
                    'activation_date' => $estate->activation_date ?? Carbon::now(),
                ]);
            }

            // Email verification (if they are a brand new user and this implicitly verified them)
            if (is_null($user->email_verified_at)) {
                $user->update(['email_verified_at' => Carbon::now()]);
            }

            // 4. Notify inviter
            if ($invitation->relationship_type === 'household_member' && $invitation->createdBy) {
                $invitation->createdBy->notify(new HouseholdMemberInvitationAcceptedNotification($user, $estate));
            }
        });
    }
}
