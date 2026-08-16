<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('collection_assignments', function (Blueprint $table) {
            $table->unsignedInteger('reminder_count')->default(0)->after('external_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collection_assignments', function (Blueprint $table) {
            $table->dropColumn('reminder_count');
        });
    }
};
