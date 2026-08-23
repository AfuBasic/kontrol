<?php

namespace App\Policies;

use App\Auth\ContextManager;
use App\Models\User;
use App\Models\Zone;

class ZonePolicy
{
    /**
     * Determine whether the user can view any zones in the active context.
     */
    public function viewAny(User $user): bool
    {
        $context = app(ContextManager::class)->current();

        if (! $context || $context->isZoneScoped()) {
            return false;
        }

        return $user->contextHasRole('admin') || $user->contextCan('zones.view');
    }

    /**
     * Determine whether the user can view the zone.
     */
    public function view(User $user, Zone $zone): bool
    {
        $context = app(ContextManager::class)->current();

        if (! $context || $context->isZoneScoped() || $zone->estate_id !== $context->estateId) {
            return false;
        }

        return $user->contextHasRole('admin') || $user->contextCan('zones.view');
    }

    /**
     * Determine whether the user can create zones.
     */
    public function create(User $user): bool
    {
        $context = app(ContextManager::class)->current();

        if (! $context || $context->isZoneScoped()) {
            return false;
        }

        return $user->contextHasRole('admin') || $user->contextCan('zones.create');
    }

    /**
     * Determine whether the user can update the zone.
     */
    public function update(User $user, Zone $zone): bool
    {
        $context = app(ContextManager::class)->current();

        if (! $context || $context->isZoneScoped() || $zone->estate_id !== $context->estateId) {
            return false;
        }

        return $user->contextHasRole('admin') || $user->contextCan('zones.edit');
    }

    /**
     * Determine whether the user can delete (archive) the zone.
     */
    public function delete(User $user, Zone $zone): bool
    {
        $context = app(ContextManager::class)->current();

        if (! $context || $context->isZoneScoped() || $zone->estate_id !== $context->estateId) {
            return false;
        }

        return $user->contextHasRole('admin') || $user->contextCan('zones.delete');
    }
}
