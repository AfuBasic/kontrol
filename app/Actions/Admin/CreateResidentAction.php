<?php

namespace App\Actions\Admin;

use App\Events\Admin\ResidentCreated;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CreateResidentAction
{
    /**
     * @param  array{name: string, email: string, phone?: string|null, unit_number?: string|null, address?: string|null}  $data
     */
    public function execute(array $data, Estate $estate): User
    {
        return DB::transaction(function () use ($data, $estate) {
            // 1. Create user with no password (invitation pending)
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => null,
            ]);

            // 2. Attach user to estate with pending status
            $estate->users()->attach($user->id, ['status' => 'pending']);

            // 3. Create/assign resident role scoped to this estate
            setPermissionsTeamId($estate->id);
            Role::firstOrCreate(['name' => 'resident', 'estate_id' => $estate->id, 'guard_name' => 'web']);
            $user->assignRole('resident');

            // 4. Create user profile with additional data
            UserProfile::create([
                'user_id' => $user->id,
                'phone' => $data['phone'] ?? null,
                'unit_number' => $data['unit_number'] ?? null,
                'address' => $data['address'] ?? null,
            ]);

            // 5. Dispatch event for side effects (invitation email)
            event(new ResidentCreated($user, $estate));

            return $user;
        });
    }
}
