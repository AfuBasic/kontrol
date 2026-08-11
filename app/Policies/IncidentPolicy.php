<?php

namespace App\Policies;

use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use App\Auth\ContextManager;

class IncidentPolicy extends BaseContextPolicy
{


    /**
     * Determine if the user can view the incident feed.
     */
    public function viewAny(User $user): bool
    {
        return app(ContextManager::class)->hasContext();
    }

    /**
     * Determine if the user can view a specific incident.
     */
    public function view(User $user, Incident $incident): bool
    {
        if (! $this->hasValidContextForEstate($incident->estate_id, $incident->zone_id)) {
            return false;
        }

        if ($incident->is_private) {
            return $incident->reporter_id === $user->id || $user->contextHasRole('admin');
        }

        return true;
    }

    /**
     * Determine if the user can create incidents in a specific estate.
     */
    public function create(User $user, Estate $estate): bool
    {
        if (! $this->hasValidContextForEstate($estate->id)) {
            return false;
        }

        return ($user->contextHasRole(['resident', 'property_owner', 'security', 'admin']))
            && ! $user->contextHasRole('household_member');
    }

    /**
     * Determine if the user can comment on an incident.
     */
    public function comment(User $user, Incident $incident): bool
    {
        if (! $this->hasValidContextForEstate($incident->estate_id, $incident->zone_id)) {
            return false;
        }

        if ($incident->is_private) {
            return $incident->reporter_id === $user->id || $user->contextHasRole('admin');
        }

        return true;
    }

    /**
     * Determine if the user can upvote an incident.
     */
    public function upvote(User $user, Incident $incident): bool
    {
        if ($incident->is_private) {
            return false;
        }

        if ($incident->reporter_id === $user->id) {
            return false;
        }

        if (! $this->hasValidContextForEstate($incident->estate_id, $incident->zone_id)) {
            return false;
        }

        return ($user->contextHasRole(['resident', 'property_owner']))
            && ! $user->contextHasRole('admin')
            && ! $user->contextHasRole('household_member');
    }

    /**
     * Determine if the user can update the status of the incident (admin-only).
     */
    public function updateStatus(User $user, Incident $incident): bool
    {
        if (! $this->hasValidContextForEstate($incident->estate_id, $incident->zone_id)) {
            return false;
        }

        return $user->contextHasRole('admin');
    }

    /**
     * Determine if the user can close the incident (reporter-only from Solved).
     */
    public function close(User $user, Incident $incident): bool
    {
        if (! $this->hasValidContextForEstate($incident->estate_id, $incident->zone_id)) {
            return false;
        }

        return $incident->reporter_id === $user->id
            && $incident->status === IncidentStatus::Solved;
    }

    /**
     * Determine if the user can delete an incident.
     */
    public function delete(User $user, Incident $incident): bool
    {
        if (! $this->hasValidContextForEstate($incident->estate_id, $incident->zone_id)) {
            return false;
        }

        return $incident->reporter_id === $user->id
            && $incident->status === IncidentStatus::Pending;
    }
}
