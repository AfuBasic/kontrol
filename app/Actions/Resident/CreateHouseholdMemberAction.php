<?php

namespace App\Actions\Resident;

use App\Actions\Invitation\CreateInvitationAction;
use App\Auth\ContextManager;
use App\Events\Resident\HouseholdMemberCreated;
use App\Models\Estate;
use App\Models\HouseholdMember;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreateHouseholdMemberAction
{
    /**
     * @param  array{name: string, email: string}  $data
     */
    public function execute(array $data, Estate $estate, User $primaryResident): User
    {
        return DB::transaction(function () use ($data, $estate, $primaryResident) {
            $email = strtolower(trim($data['email']));

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $data['name'],
                    'password' => null,
                ]
            );

            $estate->users()->syncWithoutDetaching([
                $user->id => [
                    'status' => 'pending',
                    'relationship_type' => 'household_member',
                ],
            ]);

            $role = Role::where('name', 'household_member')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);
            $user->assignRole($role);

            $primaryProfile = $primaryResident->profile;

            UserProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'phone' => null,
                    'unit_number' => $primaryProfile?->unit_number,
                    'address' => $primaryProfile?->address,
                ]
            );

            HouseholdMember::firstOrCreate([
                'estate_id' => $estate->id,
                'primary_resident_id' => $primaryResident->id,
                'household_member_id' => $user->id,
            ]);

            // Create or update Invitation in the invitations table
            app(CreateInvitationAction::class)->execute(
                email: $user->email,
                estate: $estate,
                relationshipType: 'household_member',
                role: $role,
                zoneId: $primaryProfile?->zone_id ?? $primaryResident->estateMembershipFor($estate->id)?->zone_id,
                createdBy: $primaryResident,
            );

            event(new HouseholdMemberCreated($user, $estate, $primaryResident));

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('added household member '.$user->email);

            return $user;
        });
    }
}
