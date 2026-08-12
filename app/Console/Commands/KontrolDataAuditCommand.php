<?php

namespace App\Console\Commands;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\Invitation;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Zone;
use App\Scopes\ZoneScope;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class KontrolDataAuditCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:data-audit';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform a read-only data integrity audit of Kontrol V3 models, memberships, assignments, roles, and contexts.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('====================================================');
        $this->info('        KONTROL V3 DATA INTEGRITY AUDIT            ');
        $this->info('====================================================');
        $this->newLine();

        $manualReviewQueue = [];

        // 1. Audit Estates
        $totalEstates = Estate::count();
        $activeEstates = Estate::where('status', 'active')->count();
        $inactiveEstates = Estate::where('status', '!=', 'active')->count();

        $this->comment('--- 1. ESTATES ---');
        $this->line("  Total Estates:    {$totalEstates}");
        $this->line("  Active Estates:   {$activeEstates}");
        $this->line("  Inactive Estates: {$inactiveEstates}");
        $this->newLine();

        // 2. Audit Users
        $totalUsers = User::count();
        $orphanedProfiles = UserProfile::whereDoesntHave('user')->count();
        $usersWithoutMemberships = User::whereDoesntHave('estates')->count();

        $this->comment('--- 2. USERS & PROFILES ---');
        $this->line("  Total Users:               {$totalUsers}");
        $this->line("  Orphaned Profiles:         {$orphanedProfiles}");
        $this->line("  Users Without Memberships: {$usersWithoutMemberships}");
        $this->newLine();

        // 3. Audit Estate Memberships
        $totalMemberships = DB::table('estate_users_membership')->count();
        $acceptedMemberships = DB::table('estate_users_membership')->where('status', 'accepted')->count();
        $pendingMemberships = DB::table('estate_users_membership')->where('status', 'pending')->count();
        $orphanedUserMemberships = DB::table('estate_users_membership')->whereNotIn('user_id', User::pluck('id'))->count();
        $orphanedEstateMemberships = DB::table('estate_users_membership')->whereNotIn('estate_id', Estate::pluck('id'))->count();

        $duplicateMemberships = DB::table('estate_users_membership')
            ->select('user_id', 'estate_id', DB::raw('COUNT(*) as count'))
            ->groupBy('user_id', 'estate_id')
            ->having('count', '>', 1)
            ->get();

        $this->comment('--- 3. ESTATE MEMBERSHIPS ---');
        $this->line("  Total Memberships:         {$totalMemberships}");
        $this->line("  Accepted Memberships:      {$acceptedMemberships}");
        $this->line("  Pending Memberships:       {$pendingMemberships}");
        $this->line("  Duplicate (user, estate):  {$duplicateMemberships->count()}");
        $this->line("  Orphaned User IDs:         {$orphanedUserMemberships}");
        $this->line("  Orphaned Estate IDs:       {$orphanedEstateMemberships}");
        $this->newLine();

        // 4. Audit Administrative Assignments
        $totalAssignments = AdministrativeAssignment::count();
        $activeAssignments = AdministrativeAssignment::where('is_active', true)->count();
        $inactiveAssignments = AdministrativeAssignment::where('is_active', false)->count();

        $mismatchedRoleAssignments = AdministrativeAssignment::whereHas('role', function ($query) {
            $query->whereNotNull('estate_id');
        })->get()->filter(function ($assignment) {
            return (int) $assignment->role->estate_id !== (int) $assignment->estate_id;
        });

        $globalRoleAssignments = AdministrativeAssignment::whereHas('role', function ($query) {
            $query->whereNull('estate_id');
        })->get();

        $invalidZoneAssignments = AdministrativeAssignment::whereNotNull('zone_id')->get()->filter(function ($assignment) {
            $zone = Zone::withoutGlobalScope(ZoneScope::class)->withTrashed()->find($assignment->zone_id);

            return ! $zone || (int) $zone->estate_id !== (int) $assignment->estate_id;
        });

        $duplicateAssignments = DB::table('administrative_assignments')
            ->select('user_id', 'estate_id', 'role_id', 'zone_id_coalesced', DB::raw('COUNT(*) as count'))
            ->groupBy('user_id', 'estate_id', 'role_id', 'zone_id_coalesced')
            ->having('count', '>', 1)
            ->get();

        $this->comment('--- 4. ADMINISTRATIVE ASSIGNMENTS ---');
        $this->line("  Total Assignments:         {$totalAssignments}");
        $this->line("  Active Assignments:        {$activeAssignments}");
        $this->line("  Inactive Assignments:      {$inactiveAssignments}");
        $this->line("  Global Role Assignments:   {$globalRoleAssignments->count()}");
        $this->line("  Estate Mismatch Count:     {$mismatchedRoleAssignments->count()}");
        $this->line("  Invalid Zone Assignments:  {$invalidZoneAssignments->count()}");
        $this->line("  Duplicate Assignment Groups:{$duplicateAssignments->count()}");
        $this->newLine();

        // 5. Audit Roles & Permissions
        $totalRoles = Role::count();
        $globalRoles = Role::whereNull('estate_id')->count();
        $estateScopedRoles = Role::whereNotNull('estate_id')->count();
        $totalPermissions = Permission::count();

        $this->comment('--- 5. ROLES & PERMISSIONS ---');
        $this->line("  Total Roles:               {$totalRoles}");
        $this->line("  Global Roles:              {$globalRoles}");
        $this->line("  Estate-Scoped Roles:       {$estateScopedRoles}");
        $this->line("  Total Permissions:         {$totalPermissions}");
        $this->newLine();

        // 6. Audit Property Ownership & Invitations
        $legacyProfileOwners = Schema::hasColumn('user_profiles', 'property_owner_id')
            ? UserProfile::whereNotNull('property_owner_id')->count()
            : 0;
        $membershipOwners = DB::table('estate_users_membership')->whereNotNull('property_owner_id')->count();
        $totalInvitations = Invitation::withoutGlobalScope(ZoneScope::class)->count();
        $pendingInvitations = Invitation::withoutGlobalScope(ZoneScope::class)->where('status', 'pending')->count();

        $this->comment('--- 6. PROPERTY OWNERSHIP & INVITATIONS ---');
        $this->line("  Legacy Profile Owners:     {$legacyProfileOwners}");
        $this->line("  V3 Membership Owners:      {$membershipOwners}");
        $this->line("  Total Invitations:         {$totalInvitations}");
        $this->line("  Pending Invitations:       {$pendingInvitations}");
        $this->newLine();

        // Check for manual review items
        if ($globalRoleAssignments->count() > 0) {
            foreach ($globalRoleAssignments as $assignment) {
                $manualReviewQueue[] = "Assignment #{$assignment->id}: User {$assignment->user_id} has global role #{$assignment->role_id} as estate assignment.";
            }
        }

        if ($duplicateMemberships->count() > 0) {
            foreach ($duplicateMemberships as $dup) {
                $manualReviewQueue[] = "Duplicate Membership: User {$dup->user_id} in Estate {$dup->estate_id} ({$dup->count} rows).";
            }
        }

        $this->comment('--- 7. MANUAL REVIEW QUEUE ---');
        if (count($manualReviewQueue) === 0) {
            $this->info('  ✓ Manual Review Queue is empty. No manual data reconciliation required.');
        } else {
            $this->warn('  Items requiring manual review:');
            foreach ($manualReviewQueue as $item) {
                $this->line("  - {$item}");
            }
        }

        $this->newLine();
        $this->info('KONTROL V3 Data Audit Complete!');

        return 0;
    }
}
