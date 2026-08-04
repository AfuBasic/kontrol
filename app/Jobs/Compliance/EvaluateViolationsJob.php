<?php

namespace App\Jobs\Compliance;

use App\Services\Compliance\ComplianceEngine;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EvaluateViolationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public ?int $estateId = null
    ) {}

    public function handle(ComplianceEngine $engine): void
    {
        $count = $engine->evaluateAllOpenViolations($this->estateId);
        Log::info("EvaluateViolationsJob executed: evaluated {$count} open violations.");
    }
}
