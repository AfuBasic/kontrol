<?php

namespace App\Auth;

use App\Models\AdministrativeAssignment;
use Illuminate\Support\Facades\Auth;

class AuthorizationResolver
{
    public function __construct(private ContextManager $contextManager) {}

    /**
     * Determine if the user has a specific role type within their active assignment.
     */
    public function hasRole(string|array $roles): bool
    {
        $context = $this->contextManager->current();

        if (! $context) {
            return false;
        }

        $user = Auth::user();
        if (! $user) {
            return false;
        }

        $assignment = AdministrativeAssignment::with('role')->find($context->assignmentId);

        if (! $assignment || ! $assignment->is_active) {
            return false;
        }

        if ($assignment->user_id !== $user->id || $assignment->estate_id !== $context->estateId) {
            return false;
        }

        if (! $assignment->role) {
            return false;
        }

        $roles = is_array($roles) ? $roles : [$roles];

        if (! in_array($assignment->role->name, $roles)) {
            return false;
        }

        // Final sanity check: does Spatie agree?
        // Spatie team ID is already set by the ContextManager.
        if (! $user->hasRole($assignment->role->name)) {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user has a specific permission within their active assignment.
     */
    public function can(string $permission): bool
    {
        $context = $this->contextManager->current();

        if (! $context) {
            return false;
        }

        $user = Auth::user();
        if (! $user) {
            return false;
        }

        $assignment = AdministrativeAssignment::with('role')->find($context->assignmentId);

        if (! $assignment || ! $assignment->is_active) {
            return false;
        }

        if ($assignment->user_id !== $user->id || $assignment->estate_id !== $context->estateId) {
            return false;
        }

        if (! $assignment->role) {
            return false;
        }

        // Final sanity check: does Spatie agree?
        if (! $user->hasRole($assignment->role->name)) {
            return false;
        }

        // If Spatie and the Assignment agree on the role, we can trust Spatie's permission resolution
        // for the active estate (since team ID is set by ContextManager).
        return $user->can($permission);
    }
}
