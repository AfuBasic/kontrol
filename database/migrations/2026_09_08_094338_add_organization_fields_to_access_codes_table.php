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
        Schema::table('access_codes', function (Blueprint $table) {
            $table->foreignId('organization_id')
                ->nullable()
                ->after('estate_id')
                ->constrained('estate_organizations')
                ->nullOnDelete();

            $table->foreignId('organization_member_id')
                ->nullable()
                ->after('organization_id')
                ->constrained('organization_access_members')
                ->nullOnDelete();

            $table->index(['organization_id', 'status']);
            $table->index(['organization_member_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_codes', function (Blueprint $table) {
            $table->dropForeign(['organization_member_id']);
            $table->dropForeign(['organization_id']);
            $table->dropIndex(['organization_id', 'status']);
            $table->dropIndex(['organization_member_id', 'status']);
            $table->dropColumn(['organization_member_id', 'organization_id']);
        });
    }
};
