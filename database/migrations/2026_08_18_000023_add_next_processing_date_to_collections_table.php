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
        Schema::table('collections', function (Blueprint $table) {
            $table->date('next_processing_date')->nullable()->after('due_day');
        });

        // Initialize next_processing_date for existing recurring collections
        \Illuminate\Support\Facades\DB::table('collections')
            ->where('billing_type', 'recurring')
            ->where('status', 'active')
            ->update(['next_processing_date' => \Illuminate\Support\Facades\DB::raw('start_date')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->dropColumn('next_processing_date');
        });
    }
};
