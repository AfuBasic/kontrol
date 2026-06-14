<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Collapse 'contacted', 'demo_scheduled' into 'under_review'
        DB::table('estate_applications')
            ->whereIn('status', ['contacted', 'demo_scheduled'])
            ->update(['status' => 'under_review']);

        // Collapse 'trial_started', 'converted' into 'approved'
        DB::table('estate_applications')
            ->whereIn('status', ['trial_started', 'converted'])
            ->update(['status' => 'approved']);

        // Collapse 'archived' into 'rejected'
        DB::table('estate_applications')
            ->where('status', 'archived')
            ->update(['status' => 'rejected']);

        // Make 'application_received' simply 'received'
        DB::table('estate_applications')
            ->where('status', 'application_received')
            ->update(['status' => 'received']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way migration, statuses can't easily be decomposed back accurately
    }
};
