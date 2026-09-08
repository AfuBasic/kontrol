<?php

namespace App\Policies;

use App\Models\OrganizationAccessMember;
use App\Models\OrganizationMembership;
use App\Models\User;

class OrganizationAccessMemberPolicy
{
    /**
     * Determine whether the user can view access members for their organization.
     */
    public function viewAny(User $user, int $organizationId): bool
    {
        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, OrganizationAccessMember $organizationAccessMember): bool
    {
        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $organizationAccessMember->organization_id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Determine whether the user can create models (admin only).
     */
    public function create(User $user, int $organizationId): bool
    {
        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->where('role', 'admin')
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Determine whether the user can update the model (admin only).
     */
    public function update(User $user, OrganizationAccessMember $organizationAccessMember): bool
    {
        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $organizationAccessMember->organization_id)
            ->where('role', 'admin')
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Determine whether the user can delete the model (admin only).
     */
    public function delete(User $user, OrganizationAccessMember $organizationAccessMember): bool
    {
        return $this->update($user, $organizationAccessMember);
    }
}
