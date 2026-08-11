<?php

namespace App\Actions\Auth;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\User;

class ActivateContext
{
    public function __construct(private ContextManager $contextManager) {}

    /**
     * Establish the context for a given assignment, and return the dashboard route.
     * Throws an exception or returns null if invalid.
     */
    public function execute(User $user, AdministrativeAssignment $assignment): ?string
    {
        // Use the context manager to validate and activate the assignment
        try {
            $this->contextManager->activate($assignment);
        } catch (\Exception $e) {
            return null;
        }

        // Return the dashboard route appropriate for this role
        if (! $assignment->role) {
            return null;
        }

        return $this->getRouteForRole($assignment->role->name);
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
