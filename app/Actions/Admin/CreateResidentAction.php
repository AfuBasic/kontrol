<?php

namespace App\Actions\Admin;

use App\Actions\Invitation\CreateInvitationAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Events\Admin\ResidentCreated;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Zone;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreateResidentAction
{
    public function __construct() {}

    /**
     * @param  array{name: string, email: string, phone?: string|null, unit_number?: string|null, address?: string|null}  $data
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

            if (! $membership) {
                $estate->users()->attach($user->id, [
                    'status' => 'pending',
                    'property_owner_id' => $data['property_owner_id'] ?? null,
                    'relationship_type' => 'resident',
                    'zone_id' => $data['zone_id'] ?? null,
                ]);
            } else {
                DB::table('estate_users_membership')
                    ->where('id', $membership->id)
                    ->update([
                        'property_owner_id' => $data['property_owner_id'] ?? $membership->property_owner_id,
                        'relationship_type' => 'resident',
                        'zone_id' => $data['zone_id'] ?? $membership->zone_id,
                    ]);
            }

            // 3. Assign global resident role scoped to this estate
            $role = Role::where('name', 'resident')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);

            // Assign the role via the AdministrativeAssignment system to create a valid context
            $assignmentAction = app(CreateAdministrativeAssignmentAction::class);
            $assignmentExists = AdministrativeAssignment::where('user_id', $user->id)
                ->where('estate_id', $estate->id)
                ->where('role_id', $role->id)
                ->where('zone_id_coalesced', $data['zone_id'] ?? 0)
                ->exists();

            if (! $assignmentExists) {
                $assignmentAction->execute(
                    user: $user,
                    estate: $estate,
                    role: $role,
                    scopeType: empty($data['zone_id']) ? AssignmentScope::Estate : AssignmentScope::Zone,
                    zone: empty($data['zone_id']) ? null : Zone::find($data['zone_id']),
                    isPrimary: false
                );
            }

            // 4. Create or update user profile with additional data
            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'unit_number' => $data['unit_number'] ?? null,
                    'address' => $data['address'] ?? null,
                    'property_id' => $data['property_id'] ?? null,
                ]
            );

            // 5. Create an invitation record for the unified passwordless flow
            $createInvitationAction = app(CreateInvitationAction::class);
            $invitation = $createInvitationAction->execute(
                email: $data['email'],
                estate: $estate,
                relationshipType: 'resident',
                role: null, // Residents don't get an explicit Spatie role assignment in Invitations, they are handled generically
                zoneId: empty($data['zone_id']) ? null : (int) $data['zone_id'],
                scopeType: empty($data['zone_id']) ? AssignmentScope::Estate->value : AssignmentScope::Zone->value,
                createdBy: Auth::user()
            );

            // 6. Dispatch event for side effects (invitation email)
            // If CreateInvitationAction returns null, the user is already an active member of this estate
            // and we do not need to send them a redundant invitation email.
            if ($invitation) {
                event(new ResidentCreated($invitation, $estate, false));
            }

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('invited resident '.$user->email);

            return $user;
        });
    }
}
