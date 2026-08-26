<?php

namespace App\Console\Commands;

use App\Models\PaymentTransaction;
use App\Services\Commission\CommissionService;
use Illuminate\Console\Command;

class BackfillPartnerCommissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:backfill-partner-commissions
        {--dry-run : Count matching successful resident payments without writing commission rows}
        {--estate-id= : Limit the backfill to one estate ID}
        {--chunk=100 : Number of transactions to process per chunk}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill missing partner commission rows for successful resident subscription payments.';

    /**
     * Execute the console command.
     */
    public function handle(CommissionService $commissionService): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $chunkSize = max(1, (int) $this->option('chunk'));
        $estateId = $this->option('estate-id');

        $processed = 0;
        $created = 0;
        $skipped = 0;

        $query = PaymentTransaction::query()
            ->with(['estate', 'invoice.user', 'user'])
            ->successful()
            ->whereHas('invoice', fn ($invoice) => $invoice->whereNotNull('user_id'))
            ->whereDoesntHave('commissionableRevenue')
            ->when($estateId, fn ($transactions) => $transactions->where('estate_id', $estateId))
            ->orderBy('id');

        if ($dryRun) {
            $this->info("Found {$query->count()} successful resident payment transactions without commission rows.");

            return Command::SUCCESS;
        }

        $query->chunkById($chunkSize, function ($transactions) use ($commissionService, &$processed, &$created, &$skipped): void {
            foreach ($transactions as $transaction) {
                $processed++;

                $resident = $transaction->user ?? $transaction->invoice?->user;

                if (! $resident) {
                    $skipped++;

                    continue;
                }

                if ($transaction->user_id === null) {
                    $transaction->forceFill(['user_id' => $resident->id])->save();
                }

                $revenue = $commissionService->generateCommission($resident, $transaction);

                if ($revenue) {
                    $created++;
                } else {
                    $skipped++;
                }
            }
        });

        $this->info("Processed {$processed} transactions. Created {$created} commission rows. Skipped {$skipped}.");

        return Command::SUCCESS;
    }
}
