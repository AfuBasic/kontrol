<?php

namespace App\Jobs\Admin;

use App\Models\CollectionAssignment;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateAssignmentStatusesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $today = Carbon::today();

        // 1. Pending -> Grace
        CollectionAssignment::where('status', 'pending')
            ->whereNotNull('grace_until')
            ->where('due_date', '<', $today)
            ->where('grace_until', '>=', $today)
            ->update(['status' => 'grace']);

        // 2. Pending/Grace -> Overdue
        CollectionAssignment::whereIn('status', ['pending', 'grace'])
            ->where(function ($query) use ($today) {
                $query->where(function ($q) use ($today) {
                    $q->whereNull('grace_until')
                        ->where('due_date', '<', $today);
                })->orWhere(function ($q) use ($today) {
                    $q->whereNotNull('grace_until')
                        ->where('grace_until', '<', $today);
                });
            })
            ->update(['status' => 'overdue']);
    }
}
