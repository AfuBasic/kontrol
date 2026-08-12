<?php

namespace App\Console\Commands;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class VerifyAdministrativeAssignments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:verify-administrative-assignments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify the invariants of all administrative assignments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Verifying Administrative Assignments Invariants...');

        $assignments = AdministrativeAssignment::all();
        $violations = 0;

        foreach ($assignments as $assignment) {
            $this->info("Checking Assignment ID: {$assignment->id}");

            // Invariant 1: User exists
            if (! User::where('id', $assignment->user_id)->exists()) {
                $this->error("Violation (Invariant 1): User {$assignment->user_id} does not exist.");
                $violations++;
            }

            // Invariant 2: Estate exists
            if (! Estate::where('id', $assignment->estate_id)->exists()) {
                $this->error("Violation (Invariant 2): Estate {$assignment->estate_id} does not exist.");
                $violations++;
            }

            // Invariant 3: Role exists
            $role = Role::find($assignment->role_id);
            if (! $role) {
                $this->error("Violation (Invariant 3): Role {$assignment->role_id} does not exist.");
                $violations++;

                continue;
            }

            // Invariant 4: Role is estate-scoped
            if (is_null($role->estate_id)) {
                $this->error("Violation (Invariant 4): Role {$role->name} is a global role (estate_id is null).");
                $violations++;
            }

            // Invariant 5: assignment.estate_id === role.estate_id
            if ($assignment->estate_id !== $role->estate_id) {
                $this->error("Violation (Invariant 5): Assignment estate ({$assignment->estate_id}) does not match Role estate ({$role->estate_id}).");
                $violations++;
            }

            // Invariant 6 & 7: Scope type matches zone presence
            if ($assignment->scope_type->value === 'estate' && ! is_null($assignment->zone_id)) {
                $this->error("Violation (Invariant 6): Scope is 'estate' but zone_id is not null.");
                $violations++;
            }

            if ($assignment->scope_type->value === 'zone' && is_null($assignment->zone_id)) {
                $this->error("Violation (Invariant 7): Scope is 'zone' but zone_id is null.");
                $violations++;
            }

            // Invariant 8: User belongs to the assignment estate
            $user = User::find($assignment->user_id);
            if ($user && ! $user->estates()->where('estates.id', $assignment->estate_id)->wherePivot('status', 'accepted')->exists()) {
                $this->error("Violation (Invariant 8): User {$user->id} is not an accepted member of Estate {$assignment->estate_id}.");
                $violations++;
            }
        }

        // Invariant 9: No duplicate logical assignments exist
        $duplicates = AdministrativeAssignment::select('user_id', 'estate_id', 'role_id', 'zone_id_coalesced')
            ->groupBy('user_id', 'estate_id', 'role_id', 'zone_id_coalesced')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($duplicates->isNotEmpty()) {
            foreach ($duplicates as $dup) {
                $this->error("Violation (Invariant 9): Duplicate assignment found for User {$dup->user_id}, Estate {$dup->estate_id}, Role {$dup->role_id}, Zone {$dup->zone_id_coalesced}.");
                $violations++;
            }
        }

        if ($violations > 0) {
            $this->error("Verification failed with {$violations} violations.");

            return self::FAILURE;
        }

        $this->info('All invariants passed successfully.');

        return self::SUCCESS;
    }
}
