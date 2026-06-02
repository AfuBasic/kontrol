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
        // 1. Create properties table
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('ulid', 26)->unique();
            $table->foreignId('estate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });

        // 2. Add columns to user_profiles table
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->foreignId('property_owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
        });

        // 3. Add columns to estate_board_posts table
        Schema::table('estate_board_posts', function (Blueprint $table) {
            $table->foreignId('property_owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('applies_to')->default('all');
        });

        // 4. Create estate_board_post_targets table
        Schema::create('estate_board_post_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_board_post_id')->constrained('estate_board_posts')->cascadeOnDelete();
            $table->string('target_type');
            $table->unsignedBigInteger('target_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estate_board_post_targets');

        Schema::table('estate_board_posts', function (Blueprint $table) {
            $table->dropForeign(['property_owner_id']);
            $table->dropColumn(['property_owner_id', 'applies_to']);
        });

        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropForeign(['property_owner_id']);
            $table->dropForeign(['property_id']);
            $table->dropColumn(['property_owner_id', 'property_id']);
        });

        Schema::dropIfExists('properties');
    }
};
