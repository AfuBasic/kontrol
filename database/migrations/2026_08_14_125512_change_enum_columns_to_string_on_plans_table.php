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
        Schema::table('plans', function (Blueprint $table): void {
            $table->string('billing_interval', 50)->default('annually')->change();
            $table->string('visibility', 50)->default('public')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table): void {
            // Note: Reverting string to enum might cause data loss or truncation if values don't match,
            // but it's required for rollback compatibility.
            $table->enum('billing_interval', ['monthly', 'quarterly', 'semi-annually', 'annually'])->default('annually')->change();
            $table->enum('visibility', ['public', 'private'])->default('public')->change();
        });
    }
};
