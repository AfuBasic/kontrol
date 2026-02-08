<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BulkDeleteResidentsAction
{
    /**
     * @param  array<int>  $residentIds
     * @return array{deleted: int, detached: int}
     */
    public function execute(array $residentIds, Estate $estate): array
    {
        $deleted = 0;
        $detached = 0;

        // Get residents that belong to this estate
        $residents = User::whereIn('id', $residentIds)
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
            ->get();

        DB::transaction(function () use ($residents, $estate, &$deleted, &$detached) {
            foreach ($residents as $resident) {
                // If the resident belongs to other estates, just detach them from this one
                if ($resident->estates()->where('estates.id', '!=', $estate->id)->exists()) {
                    $resident->estates()->detach($estate->id);
                    $resident->roles()->wherePivot('estate_id', $estate->id)->detach();
                    $detached++;
                } else {
                    // Otherwise, delete the user entirely
                    $resident->delete();
                    $deleted++;
                }
            }

            // Log the bulk delete activity
            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'deleted_count' => $deleted,
                    'detached_count' => $detached,
                    'resident_ids' => $residents->pluck('id')->toArray(),
                ])
                ->log('bulk deleted '.$deleted.' residents, detached '.$detached.' residents');
        });

        return [
            'deleted' => $deleted,
            'detached' => $detached,
        ];
    }
}
