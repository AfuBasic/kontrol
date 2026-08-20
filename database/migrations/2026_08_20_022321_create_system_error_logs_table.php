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
        Schema::create('system_error_logs', function (Blueprint $table) {
            $table->id();
            $table->string('fingerprint', 64)->unique();
            $table->enum('source', ['backend', 'frontend'])->default('backend');
            $table->string('level', 20)->default('error');
            $table->string('exception_class')->nullable();
            $table->text('message');
            $table->string('file', 1000)->nullable();
            $table->unsignedInteger('line')->nullable();
            $table->longText('stack_trace')->nullable();
            $table->json('context')->nullable();
            $table->enum('status', ['unresolved', 'ignored', 'resolved'])->default('unresolved');
            $table->unsignedInteger('occurrences_count')->default(1);
            $table->timestamp('first_seen_at')->useCurrent();
            $table->timestamp('last_seen_at')->useCurrent();
            $table->timestamps();

            $table->index('status');
            $table->index('source');
            $table->index('last_seen_at');
            $table->index('exception_class');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_error_logs');
    }
};
