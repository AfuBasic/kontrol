<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UpdateSecurityAction
{
    /**
     * @param  array{name: string, phone?: string|null, badge_number?: string|null}  $data
     */
    public function execute(User $security, array $data, Estate $estate): User
    {
        return DB::transaction(function () use ($security, $data, $estate) {
            $userUpdate = ['name' => $data['name']];

            if (isset($data['email']) && ! $security->email_verified_at) {
                $userUpdate['email'] = $data['email'];
            }

            $security->update($userUpdate);

            $metadata = $security->profile?->metadata ?? [];
            if (isset($data['badge_number'])) {
                $metadata['badge_number'] = $data['badge_number'];
            }

            $security->profile()->updateOrCreate(
                ['user_id' => $security->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'metadata' => $metadata ?: null,
                ]
            );

            activity('security')
                ->performedOn($security)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('updated security personnel '.$security->name);

            return $security->fresh('profile');
        });
    }
}
