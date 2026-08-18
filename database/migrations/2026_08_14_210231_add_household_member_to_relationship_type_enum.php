<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE estate_users_membership MODIFY COLUMN relationship_type ENUM('resident', 'property_owner', 'security', 'staff', 'household_member') NULL");
        } else {
            // For sqlite testing/development, changing ENUM requires table rebuild, which is messy.
            // SQLite doesn't strictly enforce ENUM anyway, but if it's MySQL we must alter it.
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE estate_users_membership MODIFY COLUMN relationship_type ENUM('resident', 'property_owner', 'security', 'staff') NULL");
        }
    }
};
