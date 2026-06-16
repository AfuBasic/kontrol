<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssignResidentsToPropertyOwnerAction
{
    public function __construct() {}

    /**
     * @param  array<int>  $residentIds
     */
    public function execute(User $propertyOwner, array $residentIds, Estate $estate): void
    {
        DB::transaction(function () use ($propertyOwner, $residentIds, $estate) {
            // Ensure all residents actually belong to this estate
            // and have a profile.
            $validResidentIds = User::query()
                ->whereIn('users.id', $residentIds)
                ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
                ->pluck('users.id')
                ->toArray();

            if (empty($validResidentIds)) {
                return;
            }

            // Update profiles to belong to the property owner
            UserProfile::whereIn('user_id', $validResidentIds)->update([
                'property_owner_id' => $propertyOwner->id,
            ]);

            activity()
                ->performedOn($propertyOwner)
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'assigned_resident_ids' => $validResidentIds,
                ])
                ->log('assigned '.count($validResidentIds).' resident(s) to property owner');
        });
    }
}
