<?php

namespace App\Console\Commands;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\Invitation;
use App\Models\Zone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class KontrolV3HealthCheckCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:v3-health-check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform a read-only pre-flight health check of Kontrol V3 architecture, database, and authorization readiness.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('====================================================');
        $this->info('      KONTROL V3 PRE-FLIGHT PRODUCTION HEALTH CHECK  ');
        $this->info('====================================================');
        $this->newLine();

        $failures = 0;

        // 1. Check Database Connectivity
        try {
            DB::connection()->getPdo();
            $this->info('✓ Database Connectivity: OK');
        } catch (\Throwable $e) {
            $this->error('✗ Database Connectivity FAILED: ' . $e->getMessage());
            $failures++;
        }

        // 2. Check Required V3 Tables
        $requiredTables = [
            'estates',
            'users',
            'estate_users_membership',
            'administrative_assignments',
            'roles',
            'permissions',
            'model_has_roles',
            'model_has_permissions',
            'invitations',
            'zones',
        ];

        foreach ($requiredTables as $table) {
            if (Schema::hasTable($table)) {
                $this->info("✓ Table exists: {$table}");
            } else {
                $this->error("✗ Missing required table: {$table}");
                $failures++;
            }
        }

        // 3. Check Administrative Assignment Security Invariants
        $globalRoleAssignments = AdministrativeAssignment::whereHas('role', function ($query) {
            $query->whereNull('estate_id');
        })->count();

        if ($globalRoleAssignments === 0) {
            $this->info('✓ Assignment Security: 0 global role assignments.');
        } else {
            $this->error("✗ Assignment Security FAILED: {$globalRoleAssignments} global role assignment(s) found.");
            $failures++;
        }

        $mismatchedAssignments = AdministrativeAssignment::whereHas('role', function ($query) {
            $query->whereNotNull('estate_id');
        })->get()->filter(function ($assignment) {
            return (int) $assignment->role->estate_id !== (int) $assignment->estate_id;
        })->count();

        if ($mismatchedAssignments === 0) {
            $this->info('✓ Assignment Security: 0 estate boundary mismatches.');
        } else {
            $this->error("✗ Assignment Security FAILED: {$mismatchedAssignments} estate mismatch(es) found.");
            $failures++;
        }

        // 4. Check Spatie Configuration
        if (config('permission.teams') === true) {
            $this->info('✓ Spatie Permission: Teams feature enabled.');
        } else {
            $this->error('✗ Spatie Permission FAILED: Teams feature is disabled.');
            $failures++;
        }

        // 5. Check ContextManager Resolvability
        try {
            $contextManager = app(\App\Auth\ContextManager::class);
            $this->info('✓ ContextManager Service: Registered & resolving cleanly.');
        } catch (\Throwable $e) {
            $this->error('✗ ContextManager Service FAILED: ' . $e->getMessage());
            $failures++;
        }

        $this->newLine();
        if ($failures === 0) {
            $this->info('RESULT: V3 PRE-FLIGHT HEALTH CHECK PASSED! System is 100% ready for production rollout.');

            return 0;
        } else {
            $this->error("RESULT: V3 PRE-FLIGHT HEALTH CHECK FAILED with {$failures} issue(s). Please review the errors above.");

            return 1;
        }
    }
}
