<?php

namespace App\Actions\Resident;

use App\Models\Estate;
use App\Models\HouseholdMember;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeleteHouseholdMemberAction
{
    public function execute(HouseholdMember $householdMember, Estate $estate): void
    {
        DB::transaction(function () use ($householdMember, $estate) {
            $member = $householdMember->member;

            activity('people')
                ->performedOn($member)
                ->causedBy(Auth::user())
                ->withProperties(['estate_id' => $estate->id])
                ->log('removed household member '.$member->name);

            // Delete the linking record
            $householdMember->delete();

            // Detach from estate
            $member->estates()->detach($estate->id);

            // Remove roles for this estate
            $member->roles()->wherePivot('estate_id', $estate->id)->detach();

            // If the member doesn't belong to any other estate, delete the user
            if (! $member->estates()->exists()) {
                $member->profile?->delete();
                $member->delete();
            }
        });
    }
}
