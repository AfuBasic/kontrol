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
            $emailChanged = isset($data['email']) && $data['email'] !== $resident->email;

            $updateData = [
                'name' => $data['name'],
            ];

            if ($emailChanged) {
                $updateData['email'] = $data['email'];
                $updateData['email_verified_at'] = null;
                $updateData['password'] = null;

                $cacheKey = "email_changes_{$resident->id}";
                $changesCount = \Illuminate\Support\Facades\Cache::get($cacheKey, 0);
                \Illuminate\Support\Facades\Cache::put($cacheKey, $changesCount + 1, now()->addYear());
            }

            $resident->update($updateData);

            if ($emailChanged) {
                event(new \App\Events\Admin\ResidentCreated($resident, $estate, true));
            }

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
