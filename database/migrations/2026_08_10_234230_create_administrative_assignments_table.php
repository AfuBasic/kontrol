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
        Schema::create('administrative_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->enum('scope_type', ['estate', 'zone'])->default('estate');
            $table->unsignedBigInteger('zone_id')->nullable();

            // MySQL 8.4 generated column to enforce NULL uniqueness
            $table->bigInteger('zone_id_coalesced')->virtualAs('COALESCE(zone_id, 0)');

            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('zone_id')->references('id')->on('zones')->cascadeOnDelete();
            $table->unique(['user_id', 'estate_id', 'role_id', 'zone_id_coalesced'], 'admin_assignments_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('administrative_assignments');
    }
};
