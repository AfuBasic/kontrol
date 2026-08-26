<?php

namespace App\Services\Zeus;

use App\Models\CommissionableRevenue;
use App\Models\PartnerEarning;
use Illuminate\Support\Facades\DB;

class SettlementInboxService
{
    /**
     * Keep partner_earnings in sync with unpaid commissionable revenues so the
     * Zeus settlements inbox is not empty when the monthly snapshot job has
     * not run (or the queue worker is down).
     */
    public function hydrateOpenPeriods(): void
    {
        $monthSql = $this->monthKeySql();

        $openPeriods = CommissionableRevenue::query()
            ->select([
                'partner_id',
                DB::raw("{$monthSql} as month_key"),
                DB::raw('SUM(commission_amount) as total_commission'),
                DB::raw('SUM(revenue_amount) as total_revenue'),
            ])
            ->whereIn('status', ['pending', 'aggregated'])
            ->whereNotNull('partner_id')
            ->groupBy('partner_id', DB::raw($monthSql))
            ->get();

        foreach ($openPeriods as $period) {
            $monthKey = (string) $period->month_key;
            $partnerId = (int) $period->partner_id;

            $earning = PartnerEarning::query()
                ->where('partner_id', $partnerId)
                ->whereDate('month', $monthKey)
                ->first();

            if ($earning?->isSettled()) {
                continue;
            }

            PartnerEarning::query()->updateOrCreate(
                [
                    'partner_id' => $partnerId,
                    'month' => $monthKey,
                ],
                [
                    'total_amount' => (int) $period->total_commission,
                    'revenue_amount' => (int) $period->total_revenue,
                    'settled_at' => null,
                ],
            );
        }
    }

    /**
     * @return array{outstanding_kobo: int, partners_with_balance: int, unsettled_count: int}
     */
    public function summary(): array
    {
        $open = CommissionableRevenue::query()
            ->whereIn('status', ['pending', 'aggregated'])
            ->whereNotNull('partner_id');

        return [
            'outstanding_kobo' => (int) (clone $open)->sum('commission_amount'),
            'partners_with_balance' => (int) (clone $open)->distinct()->count('partner_id'),
            'unsettled_count' => (int) PartnerEarning::query()->whereNull('settled_at')->count(),
        ];
    }

    private function monthKeySql(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m-01', created_at)",
            default => "DATE_FORMAT(created_at, '%Y-%m-01')",
        };
    }
}
