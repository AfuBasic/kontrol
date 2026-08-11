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

            // 2. Attach user to estate with pending status (invitation pending acceptance)
            $estate->users()->attach($user->id, ['status' => 'pending']);

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
            $user->assignRole($residentRole);
            $user->assignRole($poRole);

            // 4. Create user profile with additional data
            UserProfile::create([
                'user_id' => $user->id,
                'phone' => $data['phone'] ?? null,
                'unit_number' => $data['unit_number'] ?? null,
                'address' => $data['address'] ?? null,
            ]);

            // 5. Dispatch event for side effects (invitation email)
            event(new ResidentCreated($user, $estate, false));

            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('invited property owner '.$user->email);

            return $user;
        });
    }
}
