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
        Schema::table('commission_plans', function (Blueprint $table) {
            $table->decimal('commission_rate', 12, 2)->default(0)->change();
            $table->enum('commission_type', ['percentage', 'fixed'])
                ->default('percentage')
                ->after('commission_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('commission_plans', function (Blueprint $table) {
            $table->decimal('commission_rate', 5, 2)->default(0)->change();
            $table->dropColumn('commission_type');
        });
    }
};
