<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            try {
                DB::statement('DROP INDEX IF EXISTS affiliates_email_unique');
            } catch (Throwable) {
            }
            try {
                DB::statement('DROP INDEX IF EXISTS partners_email_unique');
            } catch (Throwable) {
            }
            try {
                DB::statement('DROP INDEX IF EXISTS partners_phone_unique');
            } catch (Throwable) {
            }

            Schema::table('partners', function (Blueprint $table) {
                $table->dropColumn(['email', 'phone']);
            });
        } else {
            Schema::table('partners', function (Blueprint $table) {
                try {
                    $table->dropUnique('affiliates_email_unique');
                } catch (Throwable) {
                }
                try {
                    $table->dropUnique('partners_email_unique');
                } catch (Throwable) {
                }
                try {
                    $table->dropUnique('partners_phone_unique');
                } catch (Throwable) {
                }
                $table->dropColumn(['email', 'phone']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->string('email')->unique()->nullable();
            $table->string('phone')->unique()->nullable();
        });
    }
};
