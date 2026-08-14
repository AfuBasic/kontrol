<?php

namespace App\Policies;

use App\Auth\ContextManager;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PartnerAssignmentPolicy
{
    use HandlesAuthorization;

    public function update(User $user, Estate $estate): bool
    {
        $context = app(ContextManager::class)->current();
        if ($context === null || $context->estateId !== $estate->id) {
            return false;
        }

        return $user->contextCan('change-partner-assignment');
    }
}
