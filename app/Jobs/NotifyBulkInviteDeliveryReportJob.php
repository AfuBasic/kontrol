<?php

namespace App\Jobs;

use App\Models\OrganizationBulkInvite;
use App\Notifications\BulkInviteDeliveryFailedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class NotifyBulkInviteDeliveryReportJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $bulkInviteId,
    ) {}

    public function handle(): void
    {
        $bulkInvite = OrganizationBulkInvite::with(['recipients', 'createdBy'])->find($this->bulkInviteId);

        if (! $bulkInvite) {
            return;
        }

        $creator = $bulkInvite->createdBy;
        if (! $creator) {
            Log::info("NotifyBulkInviteDeliveryReportJob: Creator missing for bulk invite {$this->bulkInviteId}.");

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

        if (count($failedRecipients) > 0) {
            $creator->notify(new BulkInviteDeliveryFailedNotification($bulkInvite, $failedRecipients));
            Log::info("NotifyBulkInviteDeliveryReportJob: Notified creator of ".count($failedRecipients)." failed deliveries for bulk invite {$this->bulkInviteId}.");
        }
    }
}
