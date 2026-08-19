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
        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trusted_device_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('device_authorization_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 64)->index();
            $table->string('severity', 32)->index();
            $table->string('status', 32)->index();
            $table->string('display_name')->nullable();
            $table->string('approximate_location')->nullable();
            $table->string('request_ip', 45)->nullable();
            $table->timestamp('detected_at')->index();
            $table->timestamp('resolved_at')->nullable();
            $table->string('resolution')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('timeline')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['status', 'detected_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_events');
    }
};
