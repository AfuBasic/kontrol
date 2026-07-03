<?php

namespace App\Console\Commands;

use App\Models\Estate;
use App\Services\Ledger\LedgerService;
use Illuminate\Console\Command;

class BackfillEstateTransactions extends Command
{
    protected $signature = 'ledger:backfill {--estate= : Estate ID to backfill}';

    protected $description = 'Backfill estate transactions from existing payment records';

    public function handle(LedgerService $ledgerService): int
    {
        $estateId = $this->option('estate');

        if ($estateId) {
            $estate = Estate::query()->findOrFail($estateId);
            $synced = $ledgerService->backfillEstate($estate);
            $this->info("Backfilled {$synced} records for estate {$estate->id}.");

            return self::SUCCESS;
        }

        $total = 0;
        Estate::query()->each(function (Estate $estate) use ($ledgerService, &$total) {
            $synced = $ledgerService->backfillEstate($estate);
            $total += $synced;
            if ($synced > 0) {
                $this->line("  Estate {$estate->id}: {$synced} records");
            }
        });

        $this->info("Backfill complete. {$total} records synced.");

        return self::SUCCESS;
    }
}
