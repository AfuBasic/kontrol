<?php

namespace App\Console\Commands;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class KontrolAuthAuditCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:auth-audit';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform a read-only audit of Kontrol V3 role, permission, and assignment authorization integrity.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting Kontrol V3 Authorization Integrity Audit...');
        $issuesCount = 0;

        // 1. Audit: Global roles used as estate administrative assignments
        $globalRoleAssignments = AdministrativeAssignment::whereHas('role', function ($query) {
            $query->whereNull('estate_id');
        })->get();

        if ($globalRoleAssignments->isNotEmpty()) {
            $this->error("Found {$globalRoleAssignments->count()} assignment(s) using global roles (roles.estate_id IS NULL):");
            foreach ($globalRoleAssignments as $assignment) {
                $this->line("  - Assignment ID {$assignment->id}: User {$assignment->user_id}, Estate {$assignment->estate_id}, Role ID {$assignment->role_id}");
            }
            $issuesCount += $globalRoleAssignments->count();
        } else {
            $this->info('✓ No global roles improperly assigned as administrative access.');
        }

        // 2. Audit: Assignment estate != Role estate
        $mismatchedRoleAssignments = AdministrativeAssignment::whereHas('role', function ($query) {
            $query->whereNotNull('estate_id');
        })->get()->filter(function ($assignment) {
            return (int) $assignment->role->estate_id !== (int) $assignment->estate_id;
        });

        if ($mismatchedRoleAssignments->isNotEmpty()) {
            $this->error("Found {$mismatchedRoleAssignments->count()} assignment(s) where assignment estate_id != role estate_id:");
            foreach ($mismatchedRoleAssignments as $assignment) {
                $this->line("  - Assignment ID {$assignment->id}: Assignment Estate {$assignment->estate_id} vs Role Estate {$assignment->role->estate_id}");
            }
            $issuesCount += $mismatchedRoleAssignments->count();
        } else {
            $this->info('✓ All administrative assignments match their role estate boundaries.');
        }

        // 3. Audit: Orphaned administrative assignments (missing User, Estate, or Role)
        $orphanedAssignments = AdministrativeAssignment::whereDoesntHave('user')
            ->orWhereDoesntHave('estate')
            ->orWhereDoesntHave('role')
            ->get();

        if ($orphanedAssignments->isNotEmpty()) {
            $this->error("Found {$orphanedAssignments->count()} orphaned assignment(s):");
            foreach ($orphanedAssignments as $assignment) {
                $this->line("  - Assignment ID {$assignment->id}: Missing relation.");
            }
            $issuesCount += $orphanedAssignments->count();
        } else {
            $this->info('✓ No orphaned administrative assignments found.');
        }

        // 4. Audit: Duplicate assignments
        $duplicates = DB::table('administrative_assignments')
            ->select('user_id', 'estate_id', 'role_id', 'zone_id_coalesced', DB::raw('COUNT(*) as count'))
            ->groupBy('user_id', 'estate_id', 'role_id', 'zone_id_coalesced')
            ->having('count', '>', 1)
            ->get();

        if ($duplicates->isNotEmpty()) {
            $this->error("Found {$duplicates->count()} duplicate assignment group(s):");
            foreach ($duplicates as $dup) {
                $this->line("  - User {$dup->user_id}, Estate {$dup->estate_id}, Role {$dup->role_id}, ZoneCoalesced {$dup->zone_id_coalesced}: {$dup->count} occurrences");
            }
            $issuesCount += $duplicates->count();
        } else {
            $this->info('✓ No duplicate administrative assignments found.');
        }

        // 5. Audit: Invalid zone assignment estate mismatch
        $mismatchedZoneAssignments = AdministrativeAssignment::whereNotNull('zone_id')->get()->filter(function ($assignment) {
            $zone = Zone::withTrashed()->find($assignment->zone_id);

            return $zone && (int) $zone->estate_id !== (int) $assignment->estate_id;
        });

        if ($mismatchedZoneAssignments->isNotEmpty()) {
            $this->error("Found {$mismatchedZoneAssignments->count()} zone assignment(s) where zone estate_id != assignment estate_id:");
            foreach ($mismatchedZoneAssignments as $assignment) {
                $this->line("  - Assignment ID {$assignment->id}: Assignment Estate {$assignment->estate_id} vs Zone Estate");
            }
            $issuesCount += $mismatchedZoneAssignments->count();
        } else {
            $this->info('✓ All zone-scoped assignments belong to the correct estate.');
        }

        $this->newLine();
        if ($issuesCount === 0) {
            $this->info('Audit Complete: 0 integrity issues found. Kontrol V3 Authorization architecture is healthy!');
        } else {
            $this->warn("Audit Complete: Found {$issuesCount} integrity issue(s). Please review the logs above.");
        }

        return 0;
    }
}
