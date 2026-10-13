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
        // What each person uses Kontrol on. One row per user and kind of client (the Android app, the iOS app, the
        // installed web app, a phone browser, a desktop browser), updated in place, so counting users by platform is
        // a plain query. Only the platform and app version are kept, never the user agent or the IP address.
        Schema::create('user_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // native (the store app), pwa (installed web app), mobile_web or desktop_web.
            $table->string('platform', 16);
            // ios, android, mac, windows, linux or other.
            $table->string('os', 16);
            $table->string('device_type', 16)->nullable();
            $table->string('browser', 16)->nullable();
            // Only the store app reports a version.
            $table->string('app_version', 32)->nullable();
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');

            $table->unique(['user_id', 'platform', 'os']);
            $table->index('last_seen_at');
            $table->index(['platform', 'os', 'last_seen_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_clients');
    }
};
