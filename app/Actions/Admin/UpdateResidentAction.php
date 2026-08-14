<?php

namespace App\Actions\Admin;

use App\Events\Admin\ResidentCreated;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
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

            if ($emailChanged && $resident->email === $estate->email) {
                abort(403, 'The estate creator\'s email cannot be changed.');
            }

            $updateData = [
                'name' => $data['name'],
            ];

            if ($emailChanged) {
                $updateData['email'] = $data['email'];
                $updateData['email_verified_at'] = null;
                $updateData['password'] = null;

                $cacheKey = "email_changes_{$resident->id}";
                $changesCount = Cache::get($cacheKey, 0);
                Cache::put($cacheKey, $changesCount + 1, now()->addYear());
            }

            $resident->update($updateData);

            if ($emailChanged) {
                event(new ResidentCreated($resident, $estate, true));
            }

            $resident->profile()->updateOrCreate(
                ['user_id' => $resident->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'unit_number' => $data['unit_number'] ?? null,
                    'address' => $data['address'] ?? null,
                    'property_id' => $data['property_id'] ?? null,
                ]
            );

            if (array_key_exists('property_owner_id', $data)) {
                DB::table('estate_users_membership')
                    ->where('user_id', $resident->id)
                    ->where('estate_id', $estate->id)
                    ->update([
                        'property_owner_id' => $data['property_owner_id'],
                    ]);
            }

            activity()
                ->performedOn($resident)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('updated resident '.$resident->name);

            return $resident->fresh('profile');
        });
    }
}
