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
        $securityPersonnel = User::whereIn('id', $securityIds)
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
            ->get();

        $deleteAction = app(DeleteSecurityAction::class);
        $deletedCount = 0;

        DB::transaction(function () use ($securityPersonnel, $estate, $deleteAction, &$deletedCount) {
            foreach ($securityPersonnel as $security) {
                $deleteAction->execute($security, $estate);
                $deletedCount++;
            }

            activity('security')
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'deleted_count' => $deletedCount,
                    'security_ids' => $securityPersonnel->pluck('id')->toArray(),
                ])
                ->log('bulk removed '.$deletedCount.' security personnel');
        });

        return $deletedCount;
    }
}
