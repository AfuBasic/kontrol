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
        Schema::create('impersonation_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('provider_identifier')->default('zeus');
            $table->foreignId('effective_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->string('reason')->nullable();
            $table->string('session_id')->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable()->index();
            $table->timestamps();

            $table->index(['estate_id', 'effective_user_id', 'ended_at'], 'imp_sess_estate_user_ended_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('impersonation_sessions');
    }
};
