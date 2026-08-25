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
        $residents = User::whereIn('id', $residentIds)
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
            ->where('email', '!=', $estate->email)
            ->get();

        $deleteAction = app(DeleteResidentAction::class);
        $count = 0;

        DB::transaction(function () use ($residents, $estate, $deleteAction, &$count) {
            foreach ($residents as $resident) {
                $deleteAction->execute($resident, $estate);
                $count++;
            }

            activity('people')
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'deleted_count' => $count,
                    'resident_ids' => $residents->pluck('id')->toArray(),
                ])
                ->log('bulk removed '.$count.' residents');
        });

        return [
            'deleted' => $count,
            'detached' => 0,
        ];
    }
}
