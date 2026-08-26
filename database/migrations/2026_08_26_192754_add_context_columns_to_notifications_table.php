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
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('estate_id')->nullable()->after('notifiable_id')->constrained()->nullOnDelete();
            $table->foreignId('administrative_assignment_id')
                ->nullable()
                ->after('estate_id')
                ->constrained('administrative_assignments')
                ->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->after('administrative_assignment_id')->constrained()->nullOnDelete();
            $table->string('target_role', 64)->nullable()->after('zone_id');

            $table->index(
                ['notifiable_type', 'notifiable_id', 'administrative_assignment_id', 'read_at'],
                'notifications_notifiable_assignment_read_idx'
            );
            $table->index(
                ['notifiable_type', 'notifiable_id', 'estate_id', 'target_role', 'read_at'],
                'notifications_notifiable_role_read_idx'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_notifiable_assignment_read_idx');
            $table->dropIndex('notifications_notifiable_role_read_idx');
            $table->dropForeign(['estate_id']);
            $table->dropForeign(['administrative_assignment_id']);
            $table->dropForeign(['zone_id']);
            $table->dropColumn(['estate_id', 'administrative_assignment_id', 'zone_id', 'target_role']);
        });
    }
};
