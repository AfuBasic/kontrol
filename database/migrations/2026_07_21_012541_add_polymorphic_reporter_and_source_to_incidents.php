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
        Schema::table('incidents', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['reporter_id']);
            
            // Add polymorphic type and source
            $table->string('reporter_type')->after('reporter_id')->nullable();
            $table->string('source')->after('reporter_type')->nullable();
            
            $table->index(['reporter_type', 'reporter_id']);
        });

        // Set default value for existing columns
        DB::table('incidents')->update([
            'reporter_type' => 'App\\Models\\User',
            'source' => 'resident_report',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropIndex(['reporter_type', 'reporter_id']);
            $table->dropColumn(['reporter_type', 'source']);
            
            $table->foreign('reporter_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
