<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class DeleteResidentAction
{
    public function execute(User $resident, Estate $estate): void
    {
        activity()
            ->performedOn($resident)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('deleted resident '.$resident->name);

        // If the resident belongs to other estates, just detach them from this one
        if ($resident->estates()->where('estates.id', '!=', $estate->id)->exists()) {
            $resident->estates()->detach($estate->id);

            // Also remove any roles associated with this estate
            $resident->roles()->wherePivot('estate_id', $estate->id)->detach();

            return;
        }

        // otherwise, delete the user entirely
        $resident->delete();
    }
}
