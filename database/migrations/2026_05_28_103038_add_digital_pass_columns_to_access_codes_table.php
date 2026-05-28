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
            $table->string('pass_uuid')->nullable()->unique()->after('code');
            $table->string('qr_token')->nullable()->unique()->after('pass_uuid');
            $table->string('qr_image_path')->nullable()->after('qr_token');
            $table->timestamp('scanned_at')->nullable()->after('used_at');
            $table->integer('share_count')->default(0)->after('notes');
            $table->timestamp('last_shared_at')->nullable()->after('share_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_codes', function (Blueprint $table) {
            $table->dropColumn(['pass_uuid', 'qr_token', 'qr_image_path', 'scanned_at', 'share_count', 'last_shared_at']);
        });
    }
};
