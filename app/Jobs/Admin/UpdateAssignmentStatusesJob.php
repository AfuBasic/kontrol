<?php

namespace App\Jobs\Admin;

use App\Models\CollectionAssignment;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateAssignmentStatusesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 2;

    /** @var array<int, int> Seconds to wait between attempts. */
    public array $backoff = [60];

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 300;

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

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
