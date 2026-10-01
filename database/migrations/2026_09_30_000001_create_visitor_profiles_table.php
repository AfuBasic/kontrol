<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->string('name');
            $table->string('id_photo_hash');
            $table->string('id_photo_path')->nullable();
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at')->nullable();
            $table->unsignedInteger('visit_count')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['estate_id', 'id_photo_hash'], 'visitor_profiles_estate_hash_uniq');
            $table->index(['estate_id', 'last_seen_at'], 'visitor_profiles_estate_last_seen_idx');
        });

        Schema::table('access_logs', function (Blueprint $table) {
            $table->foreignId('visitor_profile_id')
                ->nullable()
                ->after('access_code_id')
                ->constrained('visitor_profiles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropForeign(['visitor_profile_id']);
            $table->dropColumn('visitor_profile_id');
        });

        Schema::dropIfExists('visitor_profiles');
    }
};
