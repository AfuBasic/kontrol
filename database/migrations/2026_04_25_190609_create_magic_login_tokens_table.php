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
        Schema::create('magic_login_tokens', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('user_id')->constrained()->cascadeOnDelete();
            $blueprint->string('token', 64)->unique();
            $blueprint->string('destination_url')->nullable();
            $blueprint->timestamp('expires_at');
            $blueprint->timestamp('used_at')->nullable();
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('magic_login_tokens');
    }
};
