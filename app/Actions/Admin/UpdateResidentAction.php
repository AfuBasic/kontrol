<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UpdateResidentAction
{
    /**
     * @param  array{name: string, phone?: string|null, unit_number?: string|null, address?: string|null}  $data
     */
    public function execute(User $resident, array $data): User
    {
        return DB::transaction(function () use ($resident, $data) {
            $resident->update(['name' => $data['name']]);

            $resident->profile()->updateOrCreate(
                ['user_id' => $resident->id],
                [
                    'phone' => $data['phone'] ?? null,
                    'unit_number' => $data['unit_number'] ?? null,
                    'address' => $data['address'] ?? null,
                ]
            );

            return $resident->fresh('profile');
        });
    }
}
