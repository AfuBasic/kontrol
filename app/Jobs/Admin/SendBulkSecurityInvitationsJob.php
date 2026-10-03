<?php

namespace App\Jobs\Admin;

use App\Mail\Admin\SecurityInvitationMail;
use App\Models\Estate;
use App\Models\Invitation;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendBulkSecurityInvitationsJob implements ShouldQueue
{
    use Batchable, Queueable;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 1;

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 300;

    /**
     * @param  array<int>  $invitationIds
     */
    public function __construct(
        public array $invitationIds,
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

        // Process invitations in chunks to avoid memory issues
        Invitation::whereIn('id', $this->invitationIds)
            ->cursor()
            ->each(function (Invitation $invitation) use ($estate) {
                Mail::to($invitation->email)->queue(
                    new SecurityInvitationMail($invitation, $estate, false)
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
