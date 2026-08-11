<?php

namespace App\Console\Commands;

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Throwable;

class BackfillAdministrativeAssignments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:backfill-administrative-assignments {--dry-run : Perform a dry run without saving to the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfills the administrative assignments table from existing Spatie model_has_roles data';

    /**
     * Execute the console command.
     */
    public function handle(CreateAdministrativeAssignmentAction $createAction)
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info("Starting Administrative Assignment Backfill" . ($isDryRun ? " [DRY RUN]" : ""));
        
        $assignments = DB::table('model_has_roles')
            ->where('model_type', User::class)
            ->get();
            
        $stats = [
            'total' => $assignments->count(),
            'migrated' => 0,
            'skipped' => 0,
            'conflicts' => 0,
            'invalid_global' => 0,
            'invalid_user' => 0,
            'invalid_estate' => 0,
        ];
        
        $rolesCache = [];
        $estatesCache = [];
        $usersCache = [];

        foreach ($assignments as $assignment) {
            // Caching models for speed
            $role = $rolesCache[$assignment->role_id] ??= Role::find($assignment->role_id);
            if (! $role) {
                continue; // Orphaned role
            }
            
            // 1. Reject Global Roles
            if ($role->estate_id === null) {
                $stats['invalid_global']++;
                $this->warn("Skipped: Global role '{$role->name}' (User: {$assignment->model_id})");
                continue;
            }
            
            // 2. Resolve Estate
            $estateId = $assignment->estate_id;
            if (! $estateId) {
                $stats['invalid_estate']++;
                $this->warn("Skipped: Missing estate_id in pivot (User: {$assignment->model_id}, Role: {$role->name})");
                continue;
            }
            
            $estate = $estatesCache[$estateId] ??= Estate::find($estateId);
            if (! $estate) {
                $stats['invalid_estate']++;
                $this->warn("Skipped: Estate ID {$estateId} not found (User: {$assignment->model_id})");
                continue;
            }
            
            // 3. Resolve User
            $user = $usersCache[$assignment->model_id] ??= User::find($assignment->model_id);
            if (! $user) {
                $stats['invalid_user']++;
                $this->warn("Skipped: User ID {$assignment->model_id} not found");
                continue;
            }
            
            // 4. Verify cross-estate
            if ($role->estate_id !== $estate->id) {
                $stats['conflicts']++;
                $this->error("Conflict: Role {$role->name} (Estate {$role->estate_id}) assigned to Estate {$estate->id} (User: {$user->id})");
                continue;
            }
            
            // 5. Determine if it already exists (Idempotency)
            // Existing roles without zone logic assume `estate` scope.
            $exists = AdministrativeAssignment::where('user_id', $user->id)
                ->where('estate_id', $estate->id)
                ->where('role_id', $role->id)
                ->where('zone_id_coalesced', 0)
                ->exists();
                
            if ($exists) {
                $stats['skipped']++;
                $this->line("Skipped: Assignment already exists (User: {$user->id}, Role: {$role->name}, Estate: {$estate->id})");
                continue;
            }
            
            // 6. Check Membership (Required by Action)
            $hasMembership = $user->estates()
                ->where('estates.id', $estate->id)
                ->wherePivot('status', 'accepted')
                ->exists();
                
            if (! $hasMembership) {
                $stats['invalid_user']++;
                $this->warn("Skipped: User {$user->id} does not have accepted membership in Estate {$estate->id}");
                continue;
            }
            
            // 7. Create assignment
            if (! $isDryRun) {
                try {
                    $createAction->execute(
                        user: $user,
                        estate: $estate,
                        role: $role,
                        scopeType: AssignmentScope::Estate, // Default for backfill
                        zone: null,
                        isPrimary: false, // Don't guess primary in backfill
                        isActive: true
                    );
                    $stats['migrated']++;
                    $this->info("Migrated: User {$user->id} -> Role {$role->name} in Estate {$estate->id}");
                } catch (Throwable $e) {
                    $stats['conflicts']++;
                    $this->error("Conflict: Failed to migrate User {$user->id} -> Role {$role->name}. Error: {$e->getMessage()}");
                }
            } else {
                $stats['migrated']++;
                $this->info("Would migrate: User {$user->id} -> Role {$role->name} in Estate {$estate->id}");
            }
        }
        
        $this->newLine();
        $this->info("Backfill Complete.");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Source Records', $stats['total']],
                ['Migrated', $stats['migrated']],
                ['Skipped (Already Exists)', $stats['skipped']],
                ['Conflicts (Cross-Estate/Errors)', $stats['conflicts']],
                ['Invalid (Global Roles)', $stats['invalid_global']],
                ['Invalid (Missing User/Membership)', $stats['invalid_user']],
                ['Invalid (Missing/Deleted Estate)', $stats['invalid_estate']],
            ]
        );
        
        return self::SUCCESS;
    }
}
