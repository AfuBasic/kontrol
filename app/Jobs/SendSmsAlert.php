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
            Log::error("Failed to send SOS SMS to {$this->phone}: " . $e->getMessage());
            throw $e;
        }
    }
}
