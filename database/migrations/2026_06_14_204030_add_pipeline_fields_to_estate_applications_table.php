<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('estate_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('estate_applications', 'assigned_to')) {
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('estate_applications', 'challenges')) {
                $table->text('challenges')->nullable();
            }
        });

        // Alter status column from enum to string if not sqlite
        if (DB::connection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE estate_applications MODIFY COLUMN status VARCHAR(255) DEFAULT 'under_review'");
        }

        // Migrate existing 'pending' to 'under_review' to fit new pipeline stages
        DB::table('estate_applications')
            ->where('status', 'pending')
            ->update(['status' => 'under_review']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_applications', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['assigned_to', 'challenges']);
        });
    }
};
