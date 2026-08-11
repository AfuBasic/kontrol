<?php

namespace App\Services\Resident;

use App\Models\HouseholdMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class HouseholdMemberService
{
    /**
     * Get all household members for a primary resident in their current estate.
     *
     * @return Collection<int, HouseholdMember>
     */
    public function getHouseholdMembers(User $primaryResident): Collection
    {
        $estateId = $primaryResident->resolveHeadlessEstateId();

        return HouseholdMember::where('estate_id', $estateId)
            ->where('primary_resident_id', $primaryResident->id)
            ->with(['member.profile', 'member.estates' => fn ($q) => $q->where('estates.id', $estateId)])
            ->latest()
            ->get();
    }
}
