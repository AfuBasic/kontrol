<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
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
            $validResidentIds = User::query()
                ->whereIn('users.id', $residentIds)
                ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
                ->pluck('users.id')
                ->toArray();

            if (empty($validResidentIds)) {
                return;
            }

            // Ensure property owner also belongs to this estate
            $propertyOwnerMembership = DB::table('estate_users_membership')
                ->where('user_id', $propertyOwner->id)
                ->where('estate_id', $estate->id)
                ->first();

            if (! $propertyOwnerMembership) {
                throw new \InvalidArgumentException('Property owner does not belong to the estate.');
            }

            // Update estate_users_membership to belong to the property owner
            DB::table('estate_users_membership')
                ->whereIn('user_id', $validResidentIds)
                ->where('estate_id', $estate->id)
                ->update([
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
