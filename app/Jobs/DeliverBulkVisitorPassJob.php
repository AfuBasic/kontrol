<?php

namespace App\Jobs;

use App\Mail\BulkVisitorPassMail;
use App\Models\AccessCode;
use App\Models\OrganizationBulkInviteRecipient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DeliverBulkVisitorPassJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $accessCodeId,
        public ?int $recipientId = null,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $accessCode = AccessCode::with(['estate', 'bulkInviteRecipient.bulkInvite.organization'])->find($this->accessCodeId);

        if (! $accessCode) {
            Log::warning("DeliverBulkVisitorPassJob: Access code {$this->accessCodeId} not found.");

            return;
        }

        $recipient = $accessCode->bulkInviteRecipient;

        if (! $recipient && $this->recipientId) {
            $recipient = OrganizationBulkInviteRecipient::find($this->recipientId);
        }

        if (! $recipient || empty($recipient->email)) {
            Log::warning("DeliverBulkVisitorPassJob: No recipient or email found for access code {$this->accessCodeId}.");

            return;
        }

        if ($recipient->status === 'revoked' || $recipient->status === 'opted_out') {
            Log::info("DeliverBulkVisitorPassJob: Recipient {$recipient->email} is {$recipient->status}, skipping delivery.");

            return;
        }

        Mail::to($recipient->email)->send(new BulkVisitorPassMail($accessCode));

        $recipient->update([
            'last_delivered_at' => now(),
        ]);
    }
}
