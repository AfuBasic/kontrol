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
        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->index(['status', 'trial_ends_at'], 'res_sub_status_trial_idx');
            $table->index(['status', 'current_period_end'], 'res_sub_status_period_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->dropIndex('res_sub_status_trial_idx');
            $table->dropIndex('res_sub_status_period_idx');
        });
    }
};
