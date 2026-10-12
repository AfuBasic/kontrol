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
        // Laravel deletes a job's row the moment it succeeds, so this is the only record that a job ever ran.
        // One row per attempt. It stores names and timings only, never the job's payload.
        Schema::create('job_runs', function (Blueprint $table) {
            $table->id();
            $table->string('job_uuid', 36)->nullable()->index();
            $table->string('job_class');
            $table->string('job_name', 150)->index();
            $table->string('queue', 100)->nullable();
            $table->string('connection', 50)->nullable();
            $table->unsignedSmallInteger('attempt')->default(1);
            // running, succeeded, retrying (failed but will be tried again) or failed (gave up).
            $table->string('status', 12);
            $table->timestamp('started_at', 3);
            $table->timestamp('finished_at', 3)->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->string('error', 300)->nullable();

            $table->index(['started_at', 'id']);
            $table->index(['status', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_runs');
    }
};
