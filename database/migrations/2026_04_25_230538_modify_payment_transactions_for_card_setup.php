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
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable()->change();
            $table->foreignId('user_id')->nullable()->after('estate_id')->constrained('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable(false)->change();
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
