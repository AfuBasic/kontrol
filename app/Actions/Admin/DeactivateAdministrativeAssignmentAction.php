<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use Illuminate\Support\Facades\Auth;

class DeactivateAdministrativeAssignmentAction
{
    /**
     * Soft-deactivate an assignment without deleting historical data.
     *
     * If the deactivated assignment is the caller's active context, clear the session
     * so authorization cannot continue through an invalid assignment.
     */
    public function execute(AdministrativeAssignment $assignment): AdministrativeAssignment
    {
        if (! $assignment->is_active) {
            return $assignment;
        }

        $assignment->update([
            'is_active' => false,
        ]);

        $context = app(ContextManager::class)->current();

        if ($context && $context->assignmentId === $assignment->id) {
            session()->forget('active_context_assignment_id');
            app(ContextManager::class)->clear();

            // Drop Spatie team state for the current actor if they just lost their context.
            if (Auth::id() === $assignment->user_id) {
                app(ContextManager::class)->setSystemContext(null, $assignment->user);
            }
        }

        return $assignment->fresh(['user', 'role', 'zone']);
    }
}
