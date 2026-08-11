<?php

namespace App\Actions\Resident;

use App\Events\Resident\HouseholdMemberCreated;
use App\Auth\ContextManager;
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

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => null,
            ]);

            $estate->users()->attach($user->id, ['status' => 'pending']);

            $role = Role::where('name', 'household_member')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);
            $user->assignRole($role);

            $primaryProfile = $primaryResident->profile;

            UserProfile::create([
                'user_id' => $user->id,
                'phone' => null,
                'unit_number' => $primaryProfile?->unit_number,
                'address' => $primaryProfile?->address,
            ]);

            HouseholdMember::create([
                'estate_id' => $estate->id,
                'primary_resident_id' => $primaryResident->id,
                'household_member_id' => $user->id,
            ]);

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
