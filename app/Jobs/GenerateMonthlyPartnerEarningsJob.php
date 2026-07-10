<?php

namespace App\Jobs;

use App\Models\CommissionableRevenue;
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

    public const MODE_SNAPSHOT = 'snapshot';

    public const MODE_CLOSE = 'close';

    /**
     * @param  CarbonImmutable|null  $forMonth  Month to aggregate (defaults to previous calendar month for close, current for snapshot).
     * @param  string  $mode  'snapshot' leaves revenues pending; 'close' locks them as aggregated.
     */
    public function __construct(
        public readonly ?CarbonImmutable $forMonth = null,
        public readonly string $mode = self::MODE_CLOSE,
    ) {}

    public function handle(): void
    {
        $mode = in_array($this->mode, [self::MODE_SNAPSHOT, self::MODE_CLOSE], true)
            ? $this->mode
            : self::MODE_CLOSE;

        $defaultMonth = $mode === self::MODE_SNAPSHOT
            ? CarbonImmutable::now()
            : CarbonImmutable::now()->subMonthNoOverflow();

        $month = ($this->forMonth ?? $defaultMonth)->startOfMonth();
        $monthKey = $month->format('Y-m-01');
        $rangeStart = $month->startOfMonth()->startOfDay();
        $rangeEnd = $month->endOfMonth()->endOfDay();

        Log::info('GenerateMonthlyPartnerEarningsJob: aggregating', [
            'month' => $monthKey,
            'mode' => $mode,
        ]);

        // Expire commissions that fall outside the partner's commission length.
        $pendingRevenues = CommissionableRevenue::query()
            ->with('partner')
            ->where('status', 'pending')
            ->whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->get();

        foreach ($pendingRevenues as $revenue) {
            $partner = $revenue->partner;
            if ($partner && $partner->commission_length !== null && $partner->created_at) {
                $expirationDate = $partner->created_at->addMonths($partner->commission_length);
                if ($revenue->created_at->greaterThan($expirationDate)) {
                    $revenue->update(['status' => 'expired']);
                }
            }
        }

        // Snapshot only sums pending (re-runnable). Close includes already-aggregated rows for the period.
        $statusFilter = $mode === self::MODE_SNAPSHOT
            ? ['pending']
            : ['pending', 'aggregated'];

        $rows = CommissionableRevenue::query()
            ->select([
                'partner_id',
                DB::raw('SUM(commission_amount) as total_commission'),
                DB::raw('SUM(revenue_amount) as total_revenue'),
                DB::raw('COUNT(*) as record_count'),
            ])
            ->whereIn('status', $statusFilter)
            ->whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->whereNotNull('partner_id')
            ->groupBy('partner_id')
            ->get();

        foreach ($rows as $row) {
            DB::transaction(function () use ($row, $monthKey, $rangeStart, $rangeEnd, $mode) {
                // Never auto-set settled_at — payment is a separate Zeus action.
                $earning = PartnerEarning::query()
                    ->where('partner_id', $row->partner_id)
                    ->whereDate('month', $monthKey)
                    ->first();

                if ($earning?->isSettled()) {
                    // Do not overwrite a paid period.
                    return;
                }

                PartnerEarning::updateOrCreate(
                    ['partner_id' => $row->partner_id, 'month' => $monthKey],
                    [
                        'total_amount' => (int) $row->total_commission,
                        'revenue_amount' => (int) $row->total_revenue,
                        'settled_at' => null,
                    ]
                );

                if ($mode === self::MODE_CLOSE) {
                    CommissionableRevenue::query()
                        ->where('partner_id', $row->partner_id)
                        ->whereIn('status', ['pending', 'aggregated'])
                        ->whereBetween('created_at', [$rangeStart, $rangeEnd])
                        ->update(['status' => 'aggregated']);
                }
            });
        }

        Log::info('GenerateMonthlyPartnerEarningsJob: done', [
            'month' => $monthKey,
            'mode' => $mode,
            'partners_aggregated' => $rows->count(),
        ]);
    }
}
