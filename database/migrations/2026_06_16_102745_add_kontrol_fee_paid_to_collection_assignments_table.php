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
        Schema::table('collection_assignments', function (Blueprint $table) {
            $table->decimal('kontrol_fee_paid', 12, 2)->default(0)->after('amount_paid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collection_assignments', function (Blueprint $table) {
            $table->dropColumn('kontrol_fee_paid');
        });
    }
};
