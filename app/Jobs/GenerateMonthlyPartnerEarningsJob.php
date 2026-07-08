<?php

namespace App\Jobs;

use App\Models\CommissionableRevenue;
use App\Models\Partner;
use App\Models\PartnerEarning;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateMonthlyPartnerEarningsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  CarbonImmutable|null  $forMonth  The month to settle (defaults to previous calendar month).
     */
    public function __construct(
        public readonly ?CarbonImmutable $forMonth = null,
    ) {}

    public function handle(): void
    {
        $month = ($this->forMonth ?? CarbonImmutable::now()->subMonthNoOverflow())->startOfMonth();
        $monthStart = $month->startOfMonth()->toDateString();
        $monthEnd = $month->endOfMonth()->toDateString();
        $monthKey = $month->format('Y-m-01');

        Log::info('GenerateMonthlyPartnerEarningsJob: settling', ['month' => $monthKey]);

        // Fetch all unsettled commissions for the target month, grouped by partner
        $rows = CommissionableRevenue::query()
            ->select([
                'partner_id',
                DB::raw('SUM(commission_amount) as total_commission'),
                DB::raw('SUM(revenue_amount) as total_revenue'),
                DB::raw('COUNT(*) as record_count'),
            ])
            ->where('status', 'pending')
            ->whereBetween('created_at', [$month->startOfMonth()->startOfDay(), $month->endOfMonth()->endOfDay()])
            ->whereNotNull('partner_id')
            ->groupBy('partner_id')
            ->get();

        foreach ($rows as $row) {
            DB::transaction(function () use ($row, $monthKey, $monthStart, $monthEnd) {
                // Upsert the earnings record
                PartnerEarning::updateOrCreate(
                    ['partner_id' => $row->partner_id, 'month' => $monthKey],
                    [
                        'total_amount' => $row->total_commission,
                        'revenue_amount' => $row->total_revenue,
                        'settled_at' => now(),
                    ]
                );

                // Mark commissions as settled
                CommissionableRevenue::query()
                    ->where('partner_id', $row->partner_id)
                    ->where('status', 'pending')
                    ->whereBetween('created_at', [$month->startOfMonth()->startOfDay(), $month->endOfMonth()->endOfDay()])
                    ->update(['status' => 'settled']);
            });
        }

        Log::info('GenerateMonthlyPartnerEarningsJob: done', [
            'month' => $monthKey,
            'partners_settled' => $rows->count(),
        ]);
    }
}
