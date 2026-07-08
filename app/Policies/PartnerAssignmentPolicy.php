<?php

namespace App\Policies;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PartnerAssignmentPolicy
{
    use HandlesAuthorization;

    public function update(User $user, Estate $estate): bool
    {
        setPermissionsTeamId($estate->id);

        return $user->hasPermissionTo('change-partner-assignment');
    }
}
