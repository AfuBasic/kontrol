<?php

namespace App\Policies;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\User;

class AdministrativeAssignmentPolicy extends BaseContextPolicy
{
    /**
     * Determine whether the user can view any assignments in the current estate context.
     */
    public function viewAny(User $user): bool
    {
        return app(ContextManager::class)->hasContext()
            && $user->contextHasRole('admin');
    }

    /**
     * Determine whether the user can view the assignment.
     */
    public function view(User $user, AdministrativeAssignment $assignment): bool
    {
        if (! $this->hasValidContextForEstate($assignment->estate_id)) {
            return false;
        }

        return $user->contextHasRole('admin');
    }

    /**
     * Determine whether the user can create assignments in the current estate context.
     */
    public function create(User $user): bool
    {
        return app(ContextManager::class)->hasContext()
            && $user->contextHasRole('admin');
    }

    /**
     * Determine whether the user can update the assignment.
     */
    public function update(User $user, AdministrativeAssignment $assignment): bool
    {
        if (! $this->hasValidContextForEstate($assignment->estate_id)) {
            return false;
        }

        return $user->contextHasRole('admin');
    }

    /**
     * Determine whether the user can deactivate the assignment.
     */
    public function deactivate(User $user, AdministrativeAssignment $assignment): bool
    {
        return $this->update($user, $assignment);
    }
}
