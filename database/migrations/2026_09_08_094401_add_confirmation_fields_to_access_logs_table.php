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
        Schema::table('access_logs', function (Blueprint $table) {
            $table->foreignId('organization_id')
                ->nullable()
                ->after('estate_id')
                ->constrained('estate_organizations')
                ->nullOnDelete();

            $table->timestamp('confirmed_at')
                ->nullable()
                ->after('verified_by');

            $table->foreignId('confirmed_by')
                ->nullable()
                ->after('confirmed_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->index(['organization_id', 'confirmed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropForeign(['confirmed_by']);
            $table->dropForeign(['organization_id']);
            $table->dropIndex(['organization_id', 'confirmed_at']);
            $table->dropColumn(['confirmed_by', 'confirmed_at', 'organization_id']);
        });
    }
};
