<?php

namespace App\Actions\Zeus;

use App\Events\Zeus\EstateCreated;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateEstateAction
{
    /**
     * @param  array{name: string, email: string, address?: string|null}  $data
     */
    public function execute(array $data): Estate
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the estate
            $estate = Estate::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'address' => $data['address'] ?? null,
                'status' => 'active',
            ]);

            // 2. Create user with estate email (no password)
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => null,
            ]);

            // 3. Insert pivot record with pending status
            $estate->users()->attach($user->id, ['status' => 'pending']);

            // 4. Assign admin role scoped to this estate
            setPermissionsTeamId($estate->id);
            $user->assignRole('admin');

            // 5. Dispatch event for side effects (invitation email)
            event(new EstateCreated($estate, $user));

            return $estate;
        });
    }
}
