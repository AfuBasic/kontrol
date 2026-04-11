<?php

namespace App\Services;

use App\Models\EstateSubscription;
use Carbon\CarbonInterface;

class BillingCycleService
{
    /**
     * Compute the next billing date based on anchor and interval.
     *
     * @param  int  $anchorDay  Day of month (1–31)
     * @param  string  $interval  'quarterly', 'semi-annually', 'annually'
     */
    public function computeNextBillingDate(int $anchorDay, string $interval): CarbonInterface
    {
        $today = now();

        // If we're past the anchor day this month, compute next cycle
        if ($today->day > $anchorDay) {
            $baseDate = match ($interval) {
                'quarterly' => $today->addMonths(3),
                'semi-annually' => $today->addMonths(6),
                'annually' => $today->addYear(),
                default => throw new \InvalidArgumentException("Invalid billing interval: {$interval}"),
            };
        } else {
            // Still before or on anchor day this month, schedule for this month's anchor day
            $baseDate = $today;
        }

        // Set the day to anchor (handle months with fewer days)
        $day = min($anchorDay, $baseDate->daysInMonth);
        $nextDate = $baseDate->setDay($day)->startOfDay();

        return $nextDate;
    }

    /**
     * Check if an estate's subscription is due for invoicing today.
     */
    public function isDueToday(EstateSubscription $subscription): bool
    {
        if ($subscription->next_billing_date === null) {
            return false;
        }

        return $subscription->next_billing_date->isToday();
    }

    /**
     * Generate a unique invoice number.
     * Format: KTRL-{number without dashes}
     */
    public function generateInvoiceNumber(int $estateId): string
    {
        $dateStr = now()->format('Ymd');
        $sequence = 1;

        // Count invoices for this estate today
        $count = \DB::table('invoices')
            ->where('estate_id', $estateId)
            ->whereDate('created_at', today())
            ->count();

        $sequence = $count + 1;

        // Generate compact number: estate_id + date + sequence (no dashes)
        $number = sprintf('%d%s%03d', $estateId, $dateStr, $sequence);

        return sprintf('KTRL-%s', $number);
    }
}
