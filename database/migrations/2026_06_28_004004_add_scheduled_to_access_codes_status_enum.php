<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE access_codes MODIFY COLUMN status ENUM('active','scheduled','used','expired','revoked') NOT NULL DEFAULT 'active'");
    }

    public function down(): void
    {
        // Revert any scheduled codes to active before removing the enum value
        DB::statement("UPDATE access_codes SET status = 'active' WHERE status = 'scheduled'");
        DB::statement("ALTER TABLE access_codes MODIFY COLUMN status ENUM('active','used','expired','revoked') NOT NULL DEFAULT 'active'");
    }
};
