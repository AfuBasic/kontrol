<?php

namespace App\Actions\Admin;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use Illuminate\Support\Facades\DB;

class DeleteAdministrativeAssignmentAction
{
    public function execute(AdministrativeAssignment $assignment): void
    {
        DB::transaction(function () use ($assignment) {
            $user = $assignment->user;
            $role = $assignment->role;
            $estateId = $assignment->estate_id;

            app(ContextManager::class)->setSystemContext($estateId);

            if ($user && $role && $user->hasRole($role->name)) {
                $user->removeRole($role->name);
            }

            $assignment->delete();

            $context = app(ContextManager::class)->current();
            if ($context && $context->assignmentId === $assignment->id) {
                session()->forget('active_context_assignment_id');
                app(ContextManager::class)->clear();
            }
        });
    }
}
