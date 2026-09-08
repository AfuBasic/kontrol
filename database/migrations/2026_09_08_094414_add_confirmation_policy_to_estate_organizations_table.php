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
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->string('access_policy')
                ->default('managed') // 'managed' | 'public_window' | 'unrestricted'
                ->after('type');

            $table->boolean('arrival_confirmation_required')
                ->default(false)
                ->after('outside_hours_action');

            $table->unsignedInteger('confirmation_window_minutes')
                ->default(15)
                ->after('arrival_confirmation_required');

            $table->string('confirmation_escalation')
                ->default('alert_only') // 'alert_only' | 'flag_security'
                ->after('confirmation_window_minutes');

            $table->index(['estate_id', 'access_policy']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->dropIndex(['estate_id', 'access_policy']);
            $table->dropColumn([
                'confirmation_escalation',
                'confirmation_window_minutes',
                'arrival_confirmation_required',
                'access_policy',
            ]);
        });
    }
};
