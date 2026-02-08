<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BulkDeleteSecurityAction
{
    /**
     * @param  array<int>  $securityIds
     */
    public function execute(array $securityIds, Estate $estate): int
    {
        // Get security personnel that belong to this estate
        $securityPersonnel = User::whereIn('id', $securityIds)
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
            ->get();

        $deletedCount = 0;

        DB::transaction(function () use ($securityPersonnel, $estate, &$deletedCount) {
            foreach ($securityPersonnel as $security) {
                $security->delete();
                $deletedCount++;
            }

            // Log the bulk delete activity
            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'deleted_count' => $deletedCount,
                    'security_ids' => $securityPersonnel->pluck('id')->toArray(),
                ])
                ->log('bulk deleted '.$deletedCount.' security personnel');
        });

        return $deletedCount;
    }
}
