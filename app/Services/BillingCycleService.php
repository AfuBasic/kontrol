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
                'monthly' => $today->addMonth(),
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
    public function generateInvoiceNumber(int $estateId, ?int $userId = null): string
    {
        $dateStr = now()->format('Ymd');
        $sequence = 1;

        // Count invoices for this estate (and user) today
        $query = \DB::table('invoices')
            ->where('estate_id', $estateId)
            ->whereDate('created_at', today());

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id');
        }

        $count = $query->count();

        $sequence = $count + 1;

        // Generate compact number: estate_id + (user_id if exists) + date + sequence
        if ($userId) {
            $number = sprintf('%d%d%s%03d', $estateId, $userId, $dateStr, $sequence);
        } else {
            $number = sprintf('%d%s%03d', $estateId, $dateStr, $sequence);
        }

        return sprintf('KTRL-%s', $number);
    }

    /**
     * Calculate the end of a billing period.
     */
    public function calculatePeriodEnd(CarbonInterface $periodStart, string $interval): CarbonInterface
    {
        return match ($interval) {
            'quarterly' => $periodStart->copy()->addMonths(3)->subDay(),
            'semi-annually' => $periodStart->copy()->addMonths(6)->subDay(),
            'annually' => $periodStart->copy()->addYear()->subDay(),
            default => $periodStart->copy()->addMonth()->subDay(),
        };
    }
}
