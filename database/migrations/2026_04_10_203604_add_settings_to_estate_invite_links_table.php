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
        Schema::table('estate_invite_links', function (Blueprint $table) {
            $table->integer('max_usages')->nullable()->after('usage_count')->comment('Maximum number of users allowed to use this link (null for unlimited)');
            $table->boolean('requires_approval')->default(true)->after('max_usages')->comment('Whether residents joining via this link require admin approval');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_invite_links', function (Blueprint $table) {
            $table->dropColumn(['max_usages', 'requires_approval']);
        });
    }
};
