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
        $context = app(\App\Auth\ContextManager::class)->current();
        if ($context === null || $context->estateId !== $estate->id) {
            return false;
        }

        return $user->contextCan('change-partner-assignment');
    }
}
