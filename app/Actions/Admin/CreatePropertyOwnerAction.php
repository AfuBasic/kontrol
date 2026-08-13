<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Events\Admin\ResidentCreated;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreatePropertyOwnerAction
{
    public function __construct() {}

    /**
     * @param  array{name: string, email: string, phone?: string|null, unit_number?: string|null, address?: string|null, zone_id?: int|null}  $data
     */
    public function execute(array $data, Estate $estate): User
    {
        return DB::transaction(function () use ($data, $estate) {
            // 1. Get or create user (invitation pending if new user)
            $user = User::firstOrCreate(
                ['email' => strtolower(trim($data['email']))],
                [
                    'name' => $data['name'],
                    'password' => null,
                ]
            );

            // 2. Attach user to estate with pending status (invitation pending acceptance) if not exist
            $membership = DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->where('user_id', $user->id)
                ->first();

            $zone = ! empty($data['zone_id'])
                ? \App\Models\Zone::query()->where('id', $data['zone_id'])->where('estate_id', $estate->id)->first()
                : null;
            $scopeType = $zone ? \App\Enums\AssignmentScope::Zone : \App\Enums\AssignmentScope::Estate;

            if (! $membership) {
                $estate->users()->attach($user->id, [
                    'status' => 'pending',
                    'relationship_type' => 'property_owner',
                    'zone_id' => $zone?->id,
                ]);
            } else {
                DB::table('estate_users_membership')
                    ->where('id', $membership->id)
                    ->update([
                        'relationship_type' => 'property_owner',
                        'zone_id' => $zone?->id,
                    ]);
            }

            // 3. Assign global resident and property_owner roles scoped to this estate
            $residentRole = Role::where('name', 'resident')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            $poRole = Role::where('name', 'property_owner')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);

            // Assign the roles via the AdministrativeAssignment system
            $assignmentAction = app(\App\Actions\Admin\CreateAdministrativeAssignmentAction::class);
            $membershipIsAccepted = DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->where('user_id', $user->id)
                ->where('status', 'accepted')
                ->exists();

            $assignRole = function ($role) use ($user, $estate, $zone, $scopeType, $assignmentAction, $membershipIsAccepted) {
                $assignmentExists = \App\Models\AdministrativeAssignment::where('user_id', $user->id)
                    ->where('estate_id', $estate->id)
                    ->where('role_id', $role->id)
                    ->where('zone_id_coalesced', $zone?->id ?? 0)
                    ->exists();

                if ($membershipIsAccepted && ! $assignmentExists) {
                    $assignmentAction->execute(
                        user: $user,
                        estate: $estate,
                        role: $role,
                        scopeType: $scopeType,
                        zone: $zone,
                        isPrimary: false
                    );
                }
            };

            $assignRole($residentRole);
            $assignRole($poRole);

            // 4. Create user profile with additional data
            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'unit_number' => $data['unit_number'] ?? null,
                    'address' => $data['address'] ?? null,
                ]
            );

            // 5. Create an invitation record for the unified passwordless flow
            $createInvitationAction = app(\App\Actions\Invitation\CreateInvitationAction::class);
            $invitation = $createInvitationAction->execute(
                email: $data['email'],
                estate: $estate,
                relationshipType: 'property_owner',
                role: null, // Roles are handled generically for invitations
                zoneId: $zone?->id,
                scopeType: $scopeType->value,
                createdBy: Auth::user()
            );

            // 6. Dispatch event for side effects (invitation email)
            if ($invitation) {
                event(new ResidentCreated($invitation, $estate, false));
            }

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('invited property owner '.$user->email);

            return $user;
        });
    }
}
