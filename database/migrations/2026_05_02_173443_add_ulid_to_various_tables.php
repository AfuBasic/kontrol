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
        Schema::table('estates', function (Blueprint $table) {
            $table->ulid('ulid')->after('id')->nullable()->unique();
        });

        Schema::table('collections', function (Blueprint $table) {
            $table->ulid('ulid')->after('id')->nullable()->unique();
        });

        Schema::table('collection_assignments', function (Blueprint $table) {
            $table->ulid('ulid')->after('id')->nullable()->unique();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->ulid('ulid')->after('id')->nullable()->unique();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->ulid('ulid')->after('id')->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });

        Schema::table('collection_assignments', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });

        Schema::table('collections', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });

        Schema::table('estates', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });
    }
};
