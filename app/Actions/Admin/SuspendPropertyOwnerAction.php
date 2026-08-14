<?php

namespace App\Actions\Admin;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class SuspendPropertyOwnerAction
{
    public function execute(User $propertyOwner, Estate $estate, ?bool $setActive = null): bool
    {
        $poRole = Role::where('name', 'property_owner')->whereNull('estate_id')->first();

        if (! $poRole) {
            return false;
        }

        $assignment = AdministrativeAssignment::where('user_id', $propertyOwner->id)
            ->where('estate_id', $estate->id)
            ->where('role_id', $poRole->id)
            ->first();

        if (! $assignment) {
            return false;
        }

        $newActiveState = $setActive !== null ? $setActive : ! $assignment->is_active;

        $assignment->update([
            'is_active' => $newActiveState,
        ]);

        $isSuspended = ! $newActiveState;

        activity()
            ->performedOn($propertyOwner)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id, 'is_active' => $newActiveState])
            ->log($isSuspended ? 'suspended property owner role for '.$propertyOwner->name : 'activated property owner role for '.$propertyOwner->name);

        return $newActiveState;
    }
}
