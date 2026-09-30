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
        Schema::table('organization_bulk_invite_recipients', function (Blueprint $table) {
            $table->enum('delivery_status', ['pending', 'queued', 'sent', 'failed'])->default('pending')->after('last_delivered_at');
            $table->text('delivery_error')->nullable()->after('delivery_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_bulk_invite_recipients', function (Blueprint $table) {
            $table->dropColumn(['delivery_status', 'delivery_error']);
        });
    }
};
