<?php

namespace App\Jobs;

use App\Services\SMS\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendSmsAlert implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 3;

    /** @var array<int, int> Seconds to wait between attempts. */
    public array $backoff = [15, 60];

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $phone,
        public string $message
    ) {}

    /**
     * Execute the job.
     */
    public function handle(SmsService $smsService): void
    {
        try {
            $smsService->send($this->phone, $this->message);
        } catch (\Exception $e) {
            Log::error("Failed to send SOS SMS to {$this->phone}: ".$e->getMessage());
            throw $e;
        }
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
