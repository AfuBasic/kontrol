<?php

namespace App\Policies;

use App\Auth\ContextManager;
use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy extends BaseContextPolicy
{
    /**
     * Determine if the user can view roles.
     */
    public function viewAny(User $user): bool
    {
        return app(ContextManager::class)->hasContext() 
            && $user->contextHasRole('admin');
    }

    /**
     * Determine if the user can create roles.
     */
    public function create(User $user): bool
    {
        return app(ContextManager::class)->hasContext() 
            && $user->contextHasRole('admin');
    }

    /**
     * Determine if the user can update the role.
     */
    public function update(User $user, Role $role): bool
    {
        // Spatie roles use team_id to store estate_id in this architecture
        if (! $this->hasValidContextForEstate($role->estate_id)) {
            return false;
        }

        return $user->contextHasRole('admin');
    }

    /**
     * Determine if the user can delete the role.
     */
    public function delete(User $user, Role $role): bool
    {
        if (! $this->hasValidContextForEstate($role->estate_id)) {
            return false;
        }

        return $user->contextHasRole('admin');
    }
}
