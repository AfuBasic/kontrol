<?php

namespace App\Policies;

use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;

class OrganizationPolicy
{
    /**
     * Determine whether the user can view the organization.
     */
    public function view(User $user, EstateOrganization $estateOrganization): bool
    {
        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $estateOrganization->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Determine whether the user can update the organization profile/settings.
     */
    public function update(User $user, EstateOrganization $estateOrganization): bool
    {
        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $estateOrganization->id)
            ->where('role', 'admin')
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Determine whether the user can manage the organization access list.
     */
    public function manageAccessList(User $user, EstateOrganization $estateOrganization): bool
    {
        return $this->update($user, $estateOrganization);
    }

    /**
     * Determine whether the user can manage public access windows.
     */
    public function manageWindows(User $user, EstateOrganization $estateOrganization): bool
    {
        return $this->update($user, $estateOrganization);
    }

    /**
     * Determine whether the user can confirm arrivals for this organization.
     */
    public function confirmArrival(User $user, EstateOrganization $estateOrganization): bool
    {
        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $estateOrganization->id)
            ->where('is_active', true)
            ->exists();
    }
}
