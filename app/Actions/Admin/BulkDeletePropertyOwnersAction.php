<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BulkDeletePropertyOwnersAction
{
    /**
     * @param  array<int>  $propertyOwnerIds
     */
    public function execute(array $propertyOwnerIds, Estate $estate): int
    {
        $propertyOwners = User::whereIn('id', $propertyOwnerIds)
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
            ->where('email', '!=', $estate->email)
            ->get();

        $deleteAction = app(DeletePropertyOwnerAction::class);
        $count = 0;

        DB::transaction(function () use ($propertyOwners, $estate, $deleteAction, &$count) {
            foreach ($propertyOwners as $owner) {
                $deleteAction->execute($owner, $estate);
                $count++;
            }

            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'deleted_count' => $count,
                    'property_owner_ids' => $propertyOwners->pluck('id')->toArray(),
                ])
                ->log('bulk removed '.$count.' property owners');
        });

        return $count;
    }
}
