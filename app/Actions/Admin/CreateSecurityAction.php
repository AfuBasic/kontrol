<?php

namespace App\Actions\Admin;

use App\Actions\Invitation\CreateInvitationAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Events\Admin\SecurityCreated;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Zone;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreateSecurityAction
{
    /**
     * @param  array{name: string, email: string, phone?: string|null, badge_number?: string|null, zone_id?: int|null}  $data
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
                ? Zone::query()->where('id', $data['zone_id'])->where('estate_id', $estate->id)->first()
                : null;
            $scopeType = $zone ? AssignmentScope::Zone : AssignmentScope::Estate;

            if (! $membership) {
                $estate->users()->attach($user->id, [
                    'status' => 'pending',
                    'relationship_type' => 'security',
                    'zone_id' => $zone?->id,
                ]);
            } else {
                DB::table('estate_users_membership')
                    ->where('id', $membership->id)
                    ->update([
                        'relationship_type' => 'security',
                        'zone_id' => $zone?->id,
                    ]);
            }

            // 3. Assign global security role scoped to this estate
            $role = Role::where('name', 'security')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);

            // Assign the role via the AdministrativeAssignment system to create a valid context
            $assignmentAction = app(CreateAdministrativeAssignmentAction::class);
            $membershipIsAccepted = DB::table('estate_users_membership')
                ->where('estate_id', $estate->id)
                ->where('user_id', $user->id)
                ->where('status', 'accepted')
                ->exists();

            $assignmentExists = AdministrativeAssignment::where('user_id', $user->id)
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

            // 4. Create or update user profile with additional data
            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'metadata' => isset($data['badge_number']) ? ['badge_number' => $data['badge_number']] : null,
                ]
            );

            // 5. Create an invitation record for the unified passwordless flow
            $createInvitationAction = app(CreateInvitationAction::class);
            $invitation = $createInvitationAction->execute(
                email: $data['email'],
                estate: $estate,
                relationshipType: 'security',
                role: null, // Security personnel don't get an explicit Spatie role assignment in Invitations, they are handled generically
                zoneId: $zone?->id,
                scopeType: $scopeType->value,
                createdBy: Auth::user()
            );

            // 6. Dispatch event for side effects (invitation email)
            if ($invitation) {
                event(new SecurityCreated($user, $estate, false));
            }

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('invited security personnel '.$user->email);

            return $user;
        });
    }
}
