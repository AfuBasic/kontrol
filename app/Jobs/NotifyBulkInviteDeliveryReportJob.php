<?php

namespace App\Jobs;

use App\Models\OrganizationBulkInvite;
use App\Notifications\BulkInviteDeliveryFailedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotifyBulkInviteDeliveryReportJob implements ShouldQueue
{
    use Queueable;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 3;

    /** @var array<int, int> Seconds to wait between attempts. */
    public array $backoff = [30, 120];

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 60;

    public function __construct(
        public int $bulkInviteId,
    ) {}

    public function handle(): void
    {
        $bulkInvite = OrganizationBulkInvite::with(['recipients', 'createdBy'])->find($this->bulkInviteId);

        if (! $bulkInvite) {
            return;
        }

        $failedRecipients = $bulkInvite->recipients
            ->where('delivery_status', 'failed')
            ->map(fn ($r) => [
                'email' => $r->email,
                'error' => $r->delivery_error,
            ])
            ->values()
            ->all();

        if (count($failedRecipients) === 0) {
            return;
        }

        $notification = new BulkInviteDeliveryFailedNotification($bulkInvite, $failedRecipients);

        // The failure email goes to the Kontrol team only.
        Notification::route('mail', config('zeus.notification_email', 'support@usekontrol.com'))->notify($notification);

        // The batch creator is told in-app (and by push) so they know to retry, but is not emailed.
        $creator = $bulkInvite->createdBy;
        if ($creator) {
            $creator->notify($notification);
        } else {
            Log::info("NotifyBulkInviteDeliveryReportJob: Creator missing for bulk invite {$this->bulkInviteId}.");
        }

        Log::info('NotifyBulkInviteDeliveryReportJob: Reported '.count($failedRecipients)." failed deliveries for bulk invite {$this->bulkInviteId}.");
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
