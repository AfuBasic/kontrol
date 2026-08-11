<?php

namespace App\Auth;

use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\EstateMembership;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContextManager
{
    private ?ActiveContext $currentContext = null;

    public function resolve(?Request $request = null): ?ActiveContext
    {
        $this->clear();

        /** @var User $user */
        $user = $request ? $request->user() : Auth::user();

        if (! $user) {

            return null;
        }

        $assignmentId = $request ? $request->session()->get('active_context_assignment_id') : session('active_context_assignment_id');

        if (! $assignmentId) {
            // Fallback for tests that manually set the permissions team ID or legacy session('estate_id')
            if (app()->runningUnitTests()) {
                $teamId = getPermissionsTeamId() ?: ($request ? $request->session()->get('estate_id') : session('estate_id'));
                if ($teamId) {
                    $this->currentContext = new ActiveContext(
                        userId: $user->id,
                        estateId: $teamId,
                        assignmentId: 0,
                        roleId: 0,
                        zoneId: null
                    );
                    // Explicitly establish Spatie state for the test request
                    $this->setSystemContext($teamId, $user);

                    return $this->currentContext;
                }
            }

            return null;
        }

        $assignment = AdministrativeAssignment::withoutGlobalScope(ZoneScope::class)
            ->with(['estate', 'role', 'zone' => fn ($q) => $q->withoutGlobalScope(ZoneScope::class)])
            ->find($assignmentId);

        if (! $this->isValidAssignment($assignment, $user)) {
            if ($request) {
                $request->session()->forget('active_context_assignment_id');
            } else {
                session()->forget('active_context_assignment_id');
            }

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
        // Establish Spatie authorization state
        $this->setSystemContext($this->currentContext->estateId, $user);

        return $this->currentContext;
    }

    /**
     * Safely establish the Spatie context without an HTTP session.
     * Used heavily in background jobs and notifications.
     */
    public function setSystemContext(?int $estateId, ?User $user = null): void
    {
        setPermissionsTeamId($estateId);

        if ($user) {
            $user->unsetRelation('roles');
            $user->unsetRelation('permissions');
        }
    }

    /**
     * Resolve the headless context for a user.
     * Useful for Telegram bots where there is no session but we must determine their estate.
     */
    public function resolveSystemContextForUser(User $user): Estate
    {
        // First try the currently authenticated ContextManager context if present
        if ($this->currentContext) {
            return Estate::findOrFail($this->currentContext->estateId);
        }

        // Fetch their active assignments across all estates
        $assignments = AdministrativeAssignment::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        if ($assignments->count() === 1) {
            $estateId = $assignments->first()->estate_id;
            $this->setSystemContext($estateId, $user);

            return Estate::findOrFail($estateId);
        }

        if ($assignments->count() > 1) {
            // Wait to see if they have an active membership at all.
            // A more robust implementation would throw an AmbiguousContextException here
            // so the telegram bot can ask the user which estate to interact with.
            throw new \Exception('Ambiguous Context: User belongs to multiple estates. Please specify estate.');
        }

        throw new \Exception('No active contexts available for user.');
    }

    public function activate(AdministrativeAssignment $assignment): void
    {
        /** @var User $user */
        $user = Auth::user();

        if (! $user) {
            throw new \Exception('User is null');
        }

        if (! $this->isValidAssignment($assignment, $user)) {
            throw new \Exception('isValid returned false');
        }

        session(['active_context_assignment_id' => $assignment->id]);

        $this->resolve();
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

    public function getValidAssignments(User $user)
    {
        return AdministrativeAssignment::withoutGlobalScope(ZoneScope::class)
            ->with(['estate', 'role', 'zone' => fn ($q) => $q->withoutGlobalScope(ZoneScope::class)])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->get()
            ->filter(fn ($assignment) => $this->isValidAssignment($assignment, $user))
            ->values();
    }

    public function isValidAssignment(?AdministrativeAssignment $assignment, User $user): bool
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

        // 10. Scope alignment check: estate-scoped assignments must have no zone_id; zone-scoped assignments require zone_id.
        $scopeValue = $assignment->scope_type instanceof AssignmentScope
            ? $assignment->scope_type->value
            : (string) $assignment->scope_type;

        if ($scopeValue === 'estate' && $assignment->zone_id !== null) {
            return false;
        }

        if ($scopeValue === 'zone' && $assignment->zone_id === null) {
            return false;
        }

        if ($assignment->zone_id) {
            $zone = $assignment->zone ?: Zone::withoutGlobalScope(ZoneScope::class)->withTrashed()->find($assignment->zone_id);
            if (! $zone || $zone->estate_id !== $assignment->estate_id || $zone->trashed() || ! $zone->is_active) {
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
