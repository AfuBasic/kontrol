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

            return null;
        }

        $assignment = AdministrativeAssignment::withoutGlobalScope(ZoneScope::class)
            ->with(['estate', 'role', 'zone'])
            ->find($assignmentId);

        if (! $this->isValid($assignment, $user)) {
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
        
        if (! $this->isValid($assignment, $user)) {
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

    private function isValid(?AdministrativeAssignment $assignment, User $user): bool
    {
        if (! $assignment) {
            throw new \Exception('failed assignment null');
        }

        // 3. AdministrativeAssignment exists (checked above)
        // 4. AdministrativeAssignment is active.
        if (! $assignment->is_active) {
            throw new \Exception('failed active');
        }

        // 5. Assignment.user_id === authenticated user.id.
        if ($assignment->user_id !== $user->id) {
            throw new \Exception('failed user id');
        }

        // 6. Assignment.estate_id === selected estate.id. (Implicit in Eloquent model if we check $assignment->estate)
        if (! $assignment->estate) {
            throw new \Exception('failed estate');
        }

        // 7. Assignment.role_id references a valid role.
        if (! $assignment->role) {
            throw new \Exception('failed role');
        }

        // 8. Role is estate-scoped (or global dictionary role).
        // 9. Role.estate_id === assignment.estate_id (if not a global role).
        if ($assignment->role->estate_id !== null && $assignment->role->estate_id !== $assignment->estate_id) {
            throw new \Exception('failed role estate');
        }

        // 10. If assignment has zone_id: zone belongs to assignment.estate_id.
        if ($assignment->zone_id && $assignment->zone) {
            if ($assignment->zone->estate_id !== $assignment->estate_id) {
                throw new \Exception('failed zone');
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
