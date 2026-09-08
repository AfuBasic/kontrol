<?php

namespace App\Services;

use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class OrganizationContextService
{
    public const SESSION_KEY = 'active_organization_id';

    /**
     * Get the active organization for the current user session.
     */
    public function getOrganization(): EstateOrganization
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            throw new Exception('Unauthenticated');
        }

        $activeOrgId = Session::get(self::SESSION_KEY);

        if ($activeOrgId) {
            $membership = OrganizationMembership::with('organization.estate')
                ->where('user_id', $user->id)
                ->where('organization_id', $activeOrgId)
                ->where('is_active', true)
                ->first();

            if ($membership && $membership->organization && $membership->organization->is_active) {
                return $membership->organization;
            }
        }

        // Fallback: Pick the first active membership
        $fallbackMembership = OrganizationMembership::with('organization.estate')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereHas('organization', fn ($q) => $q->where('is_active', true))
            ->first();

        if (! $fallbackMembership || ! $fallbackMembership->organization) {
            throw new Exception('No organization access');
        }

        Session::put(self::SESSION_KEY, $fallbackMembership->organization_id);

        return $fallbackMembership->organization;
    }

    /**
     * Get the active membership model for the current user.
     */
    public function getMembership(): OrganizationMembership
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            throw new Exception('Unauthenticated');
        }

        $organization = $this->getOrganization();

        $membership = OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $organization->id)
            ->where('is_active', true)
            ->first();

        if (! $membership) {
            throw new Exception('Active organization membership not found');
        }

        return $membership;
    }

    /**
     * Switch active organization for the current session.
     */
    public function switchOrganization(int $organizationId): EstateOrganization
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            throw new Exception('Unauthenticated');
        }

        $membership = OrganizationMembership::with('organization')
            ->where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        if (! $membership || ! $membership->organization || ! $membership->organization->is_active) {
            throw new Exception('You do not have access to this organization');
        }

        Session::put(self::SESSION_KEY, $membership->organization_id);

        return $membership->organization;
    }

    /**
     * Check if user has active membership in given organization.
     */
    public function hasAccessTo(int $organizationId, ?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        if (! $user) {
            return false;
        }

        return OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->where('is_active', true)
            ->whereHas('organization', fn ($q) => $q->where('is_active', true))
            ->exists();
    }
}
