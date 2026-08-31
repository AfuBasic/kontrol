<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * All system-wide permissions organized by module.
     *
     * @var array<string, array<string, string>>
     */
    public const PERMISSIONS = [
        'residents' => [
            'residents.view' => 'View residents list and details',
            'residents.create' => 'Create new residents',
            'residents.edit' => 'Edit existing residents',
            'residents.delete' => 'Delete residents',
            'residents.suspend' => 'Suspend or unsuspend residents',
            'residents.reset-password' => 'Reset resident passwords',
        ],
        'property_owners' => [
            'property_owners.view' => 'View property owners list and details',
            'property_owners.create' => 'Create new property owners',
            'property_owners.edit' => 'Edit existing property owners',
            'property_owners.suspend' => 'Suspend or unsuspend property owners',
        ],
        'security' => [
            'security.view' => 'View security personnel list and details',
            'security.create' => 'Create new security personnel',
            'security.edit' => 'Edit existing security personnel',
            'security.delete' => 'Delete security personnel',
            'security.suspend' => 'Suspend or unsuspend security personnel',
            'security.reset-password' => 'Reset security personnel passwords',
        ],
        'estate-board' => [
            'estate-board.view' => 'View estate board and updates',
            'estate-board.create' => 'Create new estate updates',
            'estate-board.edit' => 'Edit existing estate updates',
            'estate-board.delete' => 'Delete estate updates',
        ],
        'roles' => [
            'roles.view' => 'View roles list and details',
            'roles.create' => 'Create new roles',
            'roles.edit' => 'Edit existing roles',
            'roles.delete' => 'Delete roles',
        ],
        'users' => [
            'users.view' => 'View all users list',
            'users.create' => 'Create new users',
            'users.edit' => 'Edit existing users',
            'users.delete' => 'Delete users',
        ],
        'visitors' => [
            'visitors.view' => 'View visitor logs and entry history',
        ],
        'incidents' => [
            'incidents.view' => 'View incidents list and details',
            'incidents.create' => 'Create new incidents',
            'incidents.edit' => 'Edit existing incidents',
            'incidents.delete' => 'Delete incidents',
            'incidents.update-status' => 'Update incident status',
        ],
        'transactions' => [
            'transactions.view' => 'View estate financial ledger and transactions',
            'transactions.view_receipts' => 'View transaction receipts',
            'transactions.download_receipts' => 'Download transaction receipts',
            'transactions.record_offline_payment' => 'Record offline payments',
            'transactions.refund' => 'Issue refunds',
            'transactions.adjust' => 'Create manual adjustments',
            'transactions.export' => 'Export transaction data',
            'transactions.audit' => 'View transaction audit history',
            'transactions.reports' => 'Generate financial reports',
        ],
        'collections' => [
            'collections.view' => 'View collections list and details',
            'collections.create' => 'Create new collections',
            'collections.edit' => 'Edit existing collections',
            'collections.delete' => 'Delete collections',
        ],
        'assignments' => [
            'assignments.view' => 'View staff and authority assignments',
            'assignments.create' => 'Create new staff and authority assignments',
            'assignments.edit' => 'Edit existing staff and authority assignments',
            'assignments.delete' => 'Delete staff and authority assignments',
        ],
        'zones' => [
            'zones.view' => 'View zones list and details',
            'zones.create' => 'Create new zones',
            'zones.edit' => 'Edit existing zones',
            'zones.delete' => 'Delete zones',
        ],
        'activity_logs' => [
            'activity_logs.view' => 'View estate activity and audit logs',
        ],
        'suspicious_activity' => [
            'suspicious_activity.view' => 'View suspicious sign-in and security events',
            'suspicious_activity.review' => 'Review and manage suspicious security events',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $created = 0;
        $skipped = 0;

        foreach (self::PERMISSIONS as $module => $permissions) {
            $this->command?->info("Seeding {$module} permissions...");

            foreach ($permissions as $name => $description) {
                $permission = Permission::firstOrCreate(
                    ['name' => $name, 'guard_name' => 'web'],
                    ['name' => $name, 'guard_name' => 'web']
                );

                if ($permission->wasRecentlyCreated) {
                    $created++;
                    $this->command?->line("  + Created: {$name}");
                } else {
                    $skipped++;
                    $this->command?->line("  - Skipped: {$name} (already exists)");
                }
            }
        }

        // Prune database permissions that are no longer defined in this seeder
        $allSeededNames = self::getAllPermissionNames();
        Permission::whereNotIn('name', $allSeededNames)->delete();

        $this->command?->newLine();
        $this->command?->info("Permissions seeded: {$created} created, {$skipped} skipped.");
    }

    /**
     * Get all permission names as a flat array.
     *
     * @return array<string>
     */
    public static function getAllPermissionNames(): array
    {
        $names = [];

        foreach (self::PERMISSIONS as $permissions) {
            $names = array_merge($names, array_keys($permissions));
        }

        return $names;
    }

    /**
     * Get permissions for a specific module.
     *
     * @return array<string, string>
     */
    public static function getModulePermissions(string $module): array
    {
        return self::PERMISSIONS[$module] ?? [];
    }
}
