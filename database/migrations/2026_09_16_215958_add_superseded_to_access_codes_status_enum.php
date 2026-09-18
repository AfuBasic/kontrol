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
            DB::statement("ALTER TABLE access_codes MODIFY COLUMN status ENUM('active','scheduled','used','expired','revoked','superseded') NOT NULL DEFAULT 'active'");
        }
    }

    public function down(): void
    {
        // Revert any superseded codes to expired before removing the enum value
        DB::statement("UPDATE access_codes SET status = 'expired' WHERE status = 'superseded'");
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE access_codes MODIFY COLUMN status ENUM('active','scheduled','used','expired','revoked') NOT NULL DEFAULT 'active'");
        }
    }
};
