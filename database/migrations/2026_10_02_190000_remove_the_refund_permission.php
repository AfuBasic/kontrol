<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

/**
 * Refunds are not built, and the code behind the `transactions.refund` permission has been removed.
 * The permission row would otherwise linger in the database and keep appearing wherever permissions
 * are listed or assigned, promising something that does nothing.
 */
return new class extends Migration
{
    public function up(): void
    {
        $tables = config('permission.table_names');

        $ids = DB::table($tables['permissions'])->where('name', 'transactions.refund')->pluck('id');

        if ($ids->isNotEmpty()) {
            DB::table($tables['role_has_permissions'])->whereIn('permission_id', $ids)->delete();
            DB::table($tables['model_has_permissions'])->whereIn('permission_id', $ids)->delete();
            DB::table($tables['permissions'])->whereIn('id', $ids)->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Brings the permission back so the seeder history stays coherent. Who held it is not restored.
        $tables = config('permission.table_names');

        DB::table($tables['permissions'])->insertOrIgnore([
            'name' => 'transactions.refund',
            'guard_name' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
