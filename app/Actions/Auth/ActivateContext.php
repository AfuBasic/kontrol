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
     * If assignment is null, it evaluates all available contexts and decides the next route.
     */
    public function execute(User $user, ?AdministrativeAssignment $assignment = null): string
    {
        if ($assignment === null) {
            $assignments = AdministrativeAssignment::where('user_id', $user->id)
                ->where('is_active', true)
                ->get();

            if ($assignments->count() === 0) {
                return url('/');
            }

            if ($assignments->count() === 1) {
                $assignment = $assignments->first();
                // continue to activation
            } else {
                return route('context.select');
            }
        }
        // Use the context manager to validate and activate the assignment
        try {
            $this->contextManager->activate($assignment);
        } catch (\Exception $e) {
            return url('/');
        }

        // Return the dashboard route appropriate for this role
        if (! $assignment->role) {
            return url('/');
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
