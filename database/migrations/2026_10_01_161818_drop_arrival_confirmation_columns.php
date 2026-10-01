<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Arrival confirmation was retired: walk-ins are admitted (or refused) at the gate and
 * organizations no longer confirm arrivals. Drop its columns from access logs and organizations.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('access_logs', function (Blueprint $table) {
            // The organization_id foreign key currently relies on the composite
            // (organization_id, confirmed_at) index; give it its own index first.
            $table->index('organization_id');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropForeign(['confirmed_by']);
            $table->dropIndex(['organization_id', 'confirmed_at']);
            $table->dropColumn(['confirmed_by', 'confirmed_at']);
        });

        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->dropColumn([
                'arrival_confirmation_required',
                'confirmation_window_minutes',
                'confirmation_escalation',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->boolean('arrival_confirmation_required')->default(false)->after('quick_entry_enabled');
            $table->unsignedInteger('confirmation_window_minutes')->default(15)->after('arrival_confirmation_required');
            $table->string('confirmation_escalation')->default('alert_only')->after('confirmation_window_minutes');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->timestamp('confirmed_at')->nullable()->after('verified_by');
            $table->foreignId('confirmed_by')->nullable()->after('confirmed_at')->constrained('users')->nullOnDelete();
            $table->index(['organization_id', 'confirmed_at']);
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropIndex(['organization_id']);
        });
    }
};
