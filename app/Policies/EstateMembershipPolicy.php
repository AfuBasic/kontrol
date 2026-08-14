<?php

namespace App\Policies;

use App\Auth\ContextManager;
use App\Models\EstateMembership;
use App\Models\User;

class EstateMembershipPolicy extends BaseContextPolicy
{
    /**
     * Determine if the user can view memberships.
     */
    public function viewAny(User $user): bool
    {
        return app(ContextManager::class)->hasContext()
            && $user->contextHasRole(['admin', 'security']); // Adjust based on requirements
    }

    /**
     * Determine if the user can view the membership.
     */
    public function view(User $user, EstateMembership $membership): bool
    {
        if (! $this->hasValidContextForEstate($membership->estate_id, $membership->zone_id)) {
            return false;
        }

        return $user->contextHasRole(['admin', 'security']);
    }

    /**
     * Determine if the user can create a membership.
     */
    public function create(User $user): bool
    {
        return app(ContextManager::class)->hasContext()
            && $user->contextHasRole('admin');
    }

    /**
     * Determine if the user can update the membership.
     */
    public function update(User $user, EstateMembership $membership): bool
    {
        if (! $this->hasValidContextForEstate($membership->estate_id, $membership->zone_id)) {
            return false;
        }

        return $user->contextHasRole('admin');
    }

    /**
     * Determine if the user can delete the membership.
     */
    public function delete(User $user, EstateMembership $membership): bool
    {
        if (! $this->hasValidContextForEstate($membership->estate_id, $membership->zone_id)) {
            return false;
        }

        return $user->contextHasRole('admin');
    }
}
