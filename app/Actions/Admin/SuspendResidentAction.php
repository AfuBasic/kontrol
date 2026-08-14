<?php

namespace App\Actions\Admin;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class SuspendResidentAction
{
    public function execute(User $resident, Estate $estate): void
    {
        $residentRoles = Role::whereIn('name', ['resident', 'household_member', 'property_owner'])
            ->whereNull('estate_id')
            ->pluck('id');

        $assignment = AdministrativeAssignment::where('user_id', $resident->id)
            ->where('estate_id', $estate->id)
            ->whereIn('role_id', $residentRoles)
            ->first();

        if ($assignment) {
            $assignment->update([
                'is_active' => ! $assignment->is_active,
            ]);

            $isSuspended = ! $assignment->is_active;

            if ($isSuspended) {
                $activeCount = AdministrativeAssignment::where('user_id', $resident->id)
                    ->where('is_active', true)
                    ->count();

                if ($activeCount === 0) {
                    $resident->update(['suspended_at' => now()]);
                }
            } else {
                if ($resident->suspended_at !== null) {
                    $resident->update(['suspended_at' => null]);
                }
            }

            activity()
                ->performedOn($resident)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id, 'is_active' => $assignment->is_active])
                ->log($isSuspended ? 'suspended resident role for '.$resident->name : 'activated resident role for '.$resident->name);
        }
    }
}
