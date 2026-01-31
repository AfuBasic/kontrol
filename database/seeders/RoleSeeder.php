<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Reserved roles that cannot be created/edited by users.
     */
    public const RESERVED_ROLES = [
        'admin',    // Estate-scoped admin role
        'security', // Global security personnel role
        'resident', // Global resident role
    ];

    /**
     * Global roles (not scoped to any estate).
     */
    public const GLOBAL_ROLES = [
        'security',
        'resident',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create global roles (no estate_id)
        foreach (self::GLOBAL_ROLES as $roleName) {
            Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web', 'estate_id' => null],
                ['name' => $roleName, 'guard_name' => 'web']
            );
        }

        $this->command->info('Default roles seeded successfully.');
    }
}
