<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UpdateResidentAction
{
    /**
     * @param  array{name: string, phone?: string|null, unit_number?: string|null, address?: string|null}  $data
     */
    public function execute(User $resident, array $data, Estate $estate): User
    {
        return DB::transaction(function () use ($resident, $data, $estate) {
            $resident->update([
                'name' => $data['name'],
                'email' => $data['email'] ?? $resident->email,
            ]);

            $resident->profile()->updateOrCreate(
                ['user_id' => $resident->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'unit_number' => $data['unit_number'] ?? null,
                    'address' => $data['address'] ?? null,
                    'property_owner_id' => $data['property_owner_id'] ?? null,
                    'property_id' => $data['property_id'] ?? null,
                ]
            );

            activity()
                ->performedOn($resident)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('updated resident '.$resident->name);

            return $resident->fresh('profile');
        });
    }
}
