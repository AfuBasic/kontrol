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
        // One row per user, kind of client and day they were active. user_clients only knows the latest sighting;
        // this is what active-users-over-time is counted from. History starts the day the recorder first ran.
        Schema::create('user_client_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('platform', 16);
            $table->string('os', 16);
            $table->date('day');

            $table->unique(['user_id', 'platform', 'os', 'day']);
            $table->index(['day', 'platform', 'os']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_client_days');
    }
};
