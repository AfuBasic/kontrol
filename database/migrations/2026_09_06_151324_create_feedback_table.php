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
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->string('ulid', 26)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('estate_id')->nullable()->constrained('estates')->nullOnDelete();
            $table->string('category', 50)->index(); // praise, improvement, idea, problem
            $table->text('message');
            $table->string('status', 50)->default('new')->index(); // new, reviewing, noted, archived
            $table->string('source', 100)->nullable(); // e.g. support_page, banner, etc.
            $table->string('platform', 50)->nullable(); // web, ios, android
            $table->string('app_version', 50)->nullable();
            $table->string('route_or_screen', 255)->nullable();
            $table->string('role_context', 50)->nullable();
            $table->boolean('support_mode')->default(false);
            $table->foreignId('impersonator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['category', 'created_at']);
            $table->index(['estate_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
