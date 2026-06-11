<?php

namespace App\Policies;

use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IncidentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can view the incident feed.
     */
    public function viewAny(User $user): bool
    {
        return $user->estates()->wherePivot('status', 'accepted')->exists();
    }

    /**
     * Determine if the user can view a specific incident.
     */
    public function view(User $user, Incident $incident): bool
    {
        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $incident->estate_id)
            ->exists();
    }

    /**
     * Determine if the user can create incidents in a specific estate.
     */
    public function create(User $user, Estate $estate): bool
    {
        $hasEstateAccess = $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $estate->id)
            ->exists();

        if (! $hasEstateAccess) {
            return false;
        }

        setPermissionsTeamId($estate->id);

        // Residents and Property Owners can report incidents.
        // Household members and Admins cannot.
        return ($user->hasRole('resident') || $user->hasRole('property_owner'))
            && ! $user->hasRole('admin')
            && ! $user->hasRole('household_member');
    }

    /**
     * Determine if the user can comment on an incident.
     */
    public function comment(User $user, Incident $incident): bool
    {
        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $incident->estate_id)
            ->exists();
    }

    /**
     * Determine if the user can upvote an incident.
     */
    public function upvote(User $user, Incident $incident): bool
    {
        if ($incident->reporter_id === $user->id) {
            return false;
        }

        $hasEstateAccess = $user->estates()
            ->wherePivot('status', 'accepted')
            ->where('estates.id', $incident->estate_id)
            ->exists();

        if (! $hasEstateAccess) {
            return false;
        }

        setPermissionsTeamId($incident->estate_id);

        // Only Residents and Property Owners can upvote incidents.
        return ($user->hasRole('resident') || $user->hasRole('property_owner'))
            && ! $user->hasRole('admin')
            && ! $user->hasRole('household_member');
    }

    /**
     * Determine if the user can update the status of the incident (admin-only).
     */
    public function updateStatus(User $user, Incident $incident): bool
    {
        setPermissionsTeamId($incident->estate_id);

        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can close the incident (reporter-only from Solved).
     */
    public function close(User $user, Incident $incident): bool
    {
        return $incident->reporter_id === $user->id
            && $incident->status === IncidentStatus::Solved;
    }

    /**
     * Determine if the user can delete an incident.
     */
    public function delete(User $user, Incident $incident): bool
    {
        return $incident->reporter_id === $user->id
            && $incident->status === IncidentStatus::Pending;
    }
}
