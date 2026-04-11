<?php

namespace App\Jobs\Billing;

use App\Actions\Billing\GenerateInvoiceAction;
use App\Models\Estate;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateInvoiceJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $estateId,
        public bool $isFirstInvoice = false,
    ) {}

    public function handle(GenerateInvoiceAction $action): void
    {
        $estate = Estate::findOrFail($this->estateId);
        $action->execute($estate, $this->isFirstInvoice);
    }
}
