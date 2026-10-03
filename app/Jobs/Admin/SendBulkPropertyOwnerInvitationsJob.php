<?php

namespace App\Jobs\Admin;

use App\Mail\Admin\PropertyOwnerInvitationMail;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendBulkPropertyOwnerInvitationsJob implements ShouldQueue
{
    use Batchable, Queueable;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 1;

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 300;

    /**
     * @param  array<int>  $userIds
     */
    public function __construct(
        public array $userIds,
        public int $estateId,
    ) {}

    public function handle(): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $estate = Estate::find($this->estateId);
        if (! $estate) {
            return;
        }

        // Process users in chunks to avoid memory issues
        User::whereIn('id', $this->userIds)
            ->cursor()
            ->each(function (User $user) use ($estate) {
                Mail::to($user->email)->queue(
                    new PropertyOwnerInvitationMail($user, $estate, false)
                );
            });
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
