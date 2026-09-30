<?php

namespace App\Jobs;

use App\Mail\BulkVisitorPassMail;
use App\Models\AccessCode;
use App\Models\OrganizationBulkInviteRecipient;
use App\Services\Visitor\BulkInvitePdfService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class DeliverBulkVisitorPassJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [30, 120, 600];

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
    public function handle(BulkInvitePdfService $pdfService): void
    {
        $accessCode = AccessCode::with(['estate', 'bulkInviteRecipient.bulkInvite.organization'])->find($this->accessCodeId);

        if (! $accessCode) {
            Log::warning("DeliverBulkVisitorPassJob: Access code {$this->accessCodeId} not found.");

            return;
        }

        $recipient = $accessCode->bulkInviteRecipient;

        if (! $recipient && $this->recipientId) {
            $recipient = OrganizationBulkInviteRecipient::with('bulkInvite.organization', 'bulkInvite.estate')->find($this->recipientId);
        }

        if (! $recipient || empty($recipient->email)) {
            Log::warning("DeliverBulkVisitorPassJob: No recipient or email found for access code {$this->accessCodeId}.");

            return;
        }

        if ($recipient->status === 'revoked' || $recipient->status === 'opted_out') {
            Log::info("DeliverBulkVisitorPassJob: Recipient {$recipient->email} is {$recipient->status}, skipping delivery.");

            return;
        }

        $pdfPath = null;

        try {
            $recipient->update([
                'delivery_status' => 'queued',
                'delivery_error' => null,
            ]);

            try {
                $pdfPath = $pdfService->generatePassPdf($recipient, $accessCode);
            } catch (Throwable $e) {
                Log::warning("DeliverBulkVisitorPassJob: Failed to generate PDF for {$recipient->email}: {$e->getMessage()}");
            }

            Mail::to($recipient->email)->send(new BulkVisitorPassMail($accessCode, $pdfPath));

            $recipient->update([
                'delivery_status' => 'sent',
                'delivery_error' => null,
                'last_delivered_at' => now(),
            ]);
        } catch (Throwable $e) {
            $recipient->update([
                'delivery_status' => 'failed',
                'delivery_error' => $e->getMessage(),
            ]);

            Log::error("DeliverBulkVisitorPassJob failed for recipient {$recipient->email}: {$e->getMessage()}");

            throw $e;
        } finally {
            if ($pdfPath && File::exists($pdfPath)) {
                File::delete($pdfPath);
            }
        }
    }

    /**
     * Handle job failure after all retries are exhausted.
     */
    public function failed(?Throwable $exception): void
    {
        if ($this->recipientId) {
            OrganizationBulkInviteRecipient::where('id', $this->recipientId)->update([
                'delivery_status' => 'failed',
                'delivery_error' => $exception?->getMessage() ?? 'Maximum delivery retries reached.',
            ]);
        }
    }
}
