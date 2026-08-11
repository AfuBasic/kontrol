<?php

namespace App\Actions\Auth;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\User;

class DetermineUserRedirect
{
    public function __construct(private ContextManager $contextManager) {}

    /**
     * Determine the redirect URL based on the user's active context or role.
     */
    public function execute(User $user): string
    {
        // Partner portal members are outside the normal estate context logic.
        if ($user->user_type === 'affiliate') {
            setPermissionsTeamId(0);

            return route('partner.dashboard');
        }

        // If the user already has an active context, route them based on the context's role.
        if ($this->contextManager->hasContext()) {
            $context = $this->contextManager->current();
            $assignment = AdministrativeAssignment::with('role')->find($context->assignmentId);

            if ($assignment && $assignment->role) {
                return $this->getRouteForRole($assignment->role->name);
            }
        }

        // The user doesn't have an active context (e.g. initial login).
        // For now, auto-select their primary or first active assignment.
        // Once the Context Picker UI is built, this logic should be replaced
        // to return the Context Picker route instead.
        
        $assignment = AdministrativeAssignment::with('role')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->orderByDesc('is_primary') // Try primary first
            ->first();

        if ($assignment && $assignment->role) {
            $this->contextManager->activate($assignment);
            
            return $this->getRouteForRole($assignment->role->name);
        }

        // Fallback for users with no assignments yet (e.g. pending setup or system edge case)
        return route('dashboard'); 
    }

    private function getRouteForRole(string $roleName): string
    {
        if ($roleName === 'security') {
            return route('security.dashboard');
        }

        if ($roleName === 'household_member') {
            return route('resident.home');
        }

        if ($roleName === 'resident') {
            return route('resident.dashboard');
        }

        // Default to admin module for 'admin' or any other estate-scoped operational role
        return route('admin.dashboard');
    }
}
