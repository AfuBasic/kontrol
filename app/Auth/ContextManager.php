<?php

namespace App\Auth;

use App\Models\AdministrativeAssignment;
use App\Models\EstateMembership;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContextManager
{
    private ?ActiveContext $currentContext = null;

    public function resolve(Request $request): ?ActiveContext
    {
        $this->clear();

        /** @var User $user */
        $user = $request->user();

        if (! $user) {

            return null;
        }

        $assignmentId = $request->session()->get('active_context_assignment_id');

        if (! $assignmentId) {

            return null;
        }

        $assignment = AdministrativeAssignment::withoutGlobalScope(ZoneScope::class)
            ->with(['estate', 'role', 'zone'])
            ->find($assignmentId);

        if (! $this->isValid($assignment, $user)) {

            $request->session()->forget('active_context_assignment_id');

            return null;
        }

        $this->currentContext = new ActiveContext(
            userId: $user->id,
            estateId: $assignment->estate_id,
            assignmentId: $assignment->id,
            roleId: $assignment->role_id,
            zoneId: $assignment->zone_id
        );

        // Clear Spatie cache to prevent leakage across context switches
        $user->unsetRelation('roles');
        $user->unsetRelation('permissions');

        // Establish Spatie authorization state
        setPermissionsTeamId($this->currentContext->estateId);

        return $this->currentContext;
    }

    public function activate(AdministrativeAssignment $assignment): void
    {
        /** @var User $user */
        $user = Auth::user();

        if (! $user || ! $this->isValid($assignment, $user)) {
            throw new \Exception('Invalid context or unauthorized.');
        }

        session(['active_context_assignment_id' => $assignment->id]);
    }

    public function current(): ?ActiveContext
    {
        return $this->currentContext;
    }

    public function hasContext(): bool
    {
        return $this->currentContext !== null;
    }

    public function clear(): void
    {
        $this->currentContext = null;
    }

    private function isValid(?AdministrativeAssignment $assignment, User $user): bool
    {
        if (! $assignment) {
            return false;
        }

        // 3. AdministrativeAssignment exists (checked above)
        // 4. AdministrativeAssignment is active.
        if (! $assignment->is_active) {
            return false;
        }

        // 5. Assignment.user_id === authenticated user.id.
        if ($assignment->user_id !== $user->id) {
            return false;
        }

        // 6. Assignment.estate_id === selected estate.id. (Implicit in Eloquent model if we check $assignment->estate)
        if (! $assignment->estate) {

            return false;
        }

        // 7. Assignment.role_id references a valid role.
        if (! $assignment->role) {

            return false;
        }

        // 8. Role is estate-scoped (or global dictionary role).
        // 9. Role.estate_id === assignment.estate_id (if not a global role).
        if ($assignment->role->estate_id !== null && $assignment->role->estate_id !== $assignment->estate_id) {

            return false;
        }

        // 10. If assignment has zone_id: zone belongs to assignment.estate_id.
        if ($assignment->zone_id && $assignment->zone) {
            if ($assignment->zone->estate_id !== $assignment->estate_id) {
                return false;
            }
        }

        // 11. User has an active EstateMembership for that estate.
        // We must bypass the ZoneScope here because the user does not have an active context yet,
        // and we need to verify their raw underlying membership before granting context.
        $hasMembership = EstateMembership::withoutGlobalScope(ZoneScope::class)
            ->where('user_id', $user->id)
            ->where('estate_id', $assignment->estate_id)
            ->where('status', 'accepted')
            ->exists();

        if (! $hasMembership) {

            return false;
        }

        return true;
    }
}
