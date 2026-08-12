<?php

namespace App\Console\Commands;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class KontrolDataRepairCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:data-repair {--dry-run=true} {--force}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform transactional, idempotent data repair for Kontrol V3 role, assignment, and membership integrity.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRunOpt = $this->option('dry-run');
        $isDryRun = ! $this->option('force') && ($dryRunOpt === true || $dryRunOpt === 'true' || $dryRunOpt === null);

        $this->info('====================================================');
        $this->info('        KONTROL V3 DATA REPAIR EXECUTION            ');
        $this->info('====================================================');
        if ($isDryRun) {
            $this->warn('  [DRY RUN MODE ENABLED - No changes will be saved to database]');
        } else {
            $this->error('  [MUTATION MODE ENABLED - Changes will be written transactionally]');
        }
        $this->newLine();

        $repairsCount = 0;

        DB::beginTransaction();

        try {
            // 1. Repair: Remove orphaned administrative assignments (missing User, Estate, or Role)
            $orphanedAssignments = AdministrativeAssignment::whereDoesntHave('user')
                ->orWhereDoesntHave('estate')
                ->orWhereDoesntHave('role')
                ->get();

            if ($orphanedAssignments->isNotEmpty()) {
                $this->warn("Found {$orphanedAssignments->count()} orphaned assignment(s):");
                foreach ($orphanedAssignments as $assignment) {
                    $this->line("  - Assignment ID {$assignment->id}: User {$assignment->user_id}, Estate {$assignment->estate_id}, Role {$assignment->role_id}");
                    if (! $isDryRun) {
                        $assignment->delete();
                    }
                    $repairsCount++;
                }
            } else {
                $this->info('✓ No orphaned administrative assignments to repair.');
            }

            // 2. Repair: Deactivate mismatched estate assignments (where assignment estate != role estate)
            $mismatchedRoleAssignments = AdministrativeAssignment::whereHas('role', function ($query) {
                $query->whereNotNull('estate_id');
            })->get()->filter(function ($assignment) {
                return (int) $assignment->role->estate_id !== (int) $assignment->estate_id;
            });

            if ($mismatchedRoleAssignments->isNotEmpty()) {
                $this->warn("Found {$mismatchedRoleAssignments->count()} mismatched assignment(s):");
                foreach ($mismatchedRoleAssignments as $assignment) {
                    $this->line("  - Assignment ID {$assignment->id}: Assignment Estate {$assignment->estate_id} vs Role Estate {$assignment->role->estate_id}");
                    if (! $isDryRun) {
                        $assignment->update(['is_active' => false]);
                    }
                    $repairsCount++;
                }
            } else {
                $this->info('✓ No mismatched estate assignments to repair.');
            }

            if ($isDryRun) {
                DB::rollBack();
                $this->newLine();
                $this->warn("Dry-Run Complete: {$repairsCount} potential repair(s) identified. Run with --force to execute.");
            } else {
                DB::commit();
                $this->newLine();
                $this->info("Data Repair Complete: {$repairsCount} repair(s) committed successfully.");
            }

            return 0;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Data repair failed and was rolled back: '.$e->getMessage());

            return 1;
        }
    }
}
