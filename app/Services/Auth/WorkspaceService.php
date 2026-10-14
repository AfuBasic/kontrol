<?php

namespace App\Services\Auth;

use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * The organizations a person can work in. A person's workspaces are their estate roles plus these, and a person
 * with more than one workspace must be asked which to enter rather than being sent into whichever is checked first.
 */
class WorkspaceService
{
    /**
     * Active memberships in organizations that are themselves active, with the organization loaded.
     *
     * @return Collection<int, OrganizationMembership>
     */
    public function organizationMemberships(User $user): Collection
    {
        return OrganizationMembership::query()
            ->with('organization')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereHas('organization', fn ($query) => $query->where('is_active', true))
            ->get()
            ->sortBy(fn (OrganizationMembership $membership) => mb_strtolower((string) $membership->organization?->name))
            ->values();
    }

    public function organizationCount(User $user): int
    {
        return OrganizationMembership::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereHas('organization', fn ($query) => $query->where('is_active', true))
            ->count();
    }
}
