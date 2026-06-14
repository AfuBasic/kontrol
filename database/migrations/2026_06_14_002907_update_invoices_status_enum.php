<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is tricky to reverse because if there are rows with 'cancelled', reverting will fail or truncate data.
        // For safety, we just leave it or revert to the previous enum if we are sure no 'cancelled' rows exist.
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending'");
    }
};
