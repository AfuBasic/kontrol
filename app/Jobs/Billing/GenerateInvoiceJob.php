<?php

namespace App\Jobs\Billing;

use App\Actions\Billing\GenerateInvoiceAction;
use App\Models\Estate;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateInvoiceJob implements ShouldQueue
{
    use Queueable;

    /** Times the job may be attempted. Retried only where running it twice is harmless. */
    public int $tries = 1;

    /** Seconds before the worker gives up on a run. Must stay below the queue's retry_after. */
    public int $timeout = 300;

    public function __construct(
        public int $estateId,
        public bool $isFirstInvoice = false,
    ) {}

    public function handle(GenerateInvoiceAction $action): void
    {
        $estate = Estate::findOrFail($this->estateId);
        $action->execute($estate, $this->isFirstInvoice);
    }

    /**
     * Leave a trace when the job gives up, so a failed run is something we notice.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('Queued job failed: '.static::class, ['error' => $exception?->getMessage()]);
    }
}
