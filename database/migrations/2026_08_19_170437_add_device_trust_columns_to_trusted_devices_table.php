<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trusted_devices', function (Blueprint $table) {
            $table->ulid('ulid')->nullable()->after('id');
            $table->string('token_hash', 64)->nullable()->after('user_id');
            $table->string('display_name')->nullable();
            $table->string('device_type', 32)->nullable();
            $table->string('platform', 32)->nullable();
            $table->string('browser', 32)->nullable();
            $table->string('approximate_location')->nullable();
            $table->string('last_session_id', 100)->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('trusted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::table('trusted_devices', function (Blueprint $table) {
            $table->string('user_agent_hash', 64)->nullable()->change();
        });

        $now = now();
        $legacyDevices = DB::table('trusted_devices')->orderBy('id')->get();

        foreach ($legacyDevices as $row) {
            DB::table('trusted_devices')->where('id', $row->id)->update([
                'ulid' => (string) Str::ulid(),
                'revoked_at' => $row->revoked_at ?? $now,
                'first_seen_at' => $row->created_at ?? $now,
                'updated_at' => $now,
            ]);
        }

        Schema::table('trusted_devices', function (Blueprint $table) {
            $table->unique('ulid');
            $table->unique('token_hash');
            $table->index(['user_id', 'revoked_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trusted_devices', function (Blueprint $table) {
            $table->dropUnique(['ulid']);
            $table->dropUnique(['token_hash']);
            $table->dropIndex(['user_id', 'revoked_at']);
            $table->dropColumn([
                'ulid',
                'token_hash',
                'display_name',
                'device_type',
                'platform',
                'browser',
                'approximate_location',
                'last_session_id',
                'first_seen_at',
                'trusted_at',
                'revoked_at',
                'expires_at',
                'updated_at',
            ]);
        });
    }
};
