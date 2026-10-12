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
        Schema::table('job_runs', function (Blueprint $table) {
            // Which worker process ran the attempt (its supervisor name, e.g. worker-heavy_00), so the
            // history can show who is busy and who has gone quiet.
            $table->string('worker', 100)->nullable()->after('connection');

            $table->index(['queue', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_runs', function (Blueprint $table) {
            $table->dropIndex(['queue', 'started_at']);
            $table->dropColumn('worker');
        });
    }
};
