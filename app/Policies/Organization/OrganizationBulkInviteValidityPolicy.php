<?php

namespace App\Policies\Organization;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

class OrganizationBulkInviteValidityPolicy
{
    /**
     * Maximum number of recipients in a single bulk invite.
     */
    public const MAX_RECIPIENTS = 20;

    /**
     * Maximum validity period in days for a bulk invite cycle.
     */
    public const MAX_VALIDITY_DAYS = 30;

    /**
     * Validate and normalize a collection or array of emails.
     *
     * @param  array<int, string>  $emails
     * @return array<int, string>
     *
     * @throws ValidationException
     */
    public static function normalizeEmails(array $emails): array
    {
        $normalized = [];

        foreach ($emails as $email) {
            $cleaned = strtolower(trim((string) $email));
            if (! empty($cleaned) && filter_var($cleaned, FILTER_VALIDATE_EMAIL)) {
                $normalized[] = $cleaned;
            }
        }

        $unique = array_values(array_unique($normalized));

        if (empty($unique)) {
            throw ValidationException::withMessages([
                'emails' => ['At least one valid recipient email is required.'],
            ]);
        }

        if (count($unique) > self::MAX_RECIPIENTS) {
            throw ValidationException::withMessages([
                'emails' => ['Bulk visitor invites are limited to a maximum of '.self::MAX_RECIPIENTS.' recipients.'],
            ]);
        }

        return $unique;
    }

    /**
     * Validate the validity date window.
     *
     * @throws ValidationException
     */
    public static function validateDates(CarbonInterface $validFrom, CarbonInterface $validUntil): void
    {
        if ($validUntil->lessThan($validFrom)) {
            throw ValidationException::withMessages([
                'valid_until' => ['The end date must be on or after the start date.'],
            ]);
        }

        $fromDay = CarbonImmutable::instance($validFrom)->startOfDay();
        $untilDay = CarbonImmutable::instance($validUntil)->startOfDay();

        $days = $fromDay->diffInDays($untilDay) + 1;

        if ($days > self::MAX_VALIDITY_DAYS) {
            throw ValidationException::withMessages([
                'valid_until' => ['Bulk visitor passes cannot exceed '.self::MAX_VALIDITY_DAYS.' days in validity.'],
            ]);
        }
    }

    /**
     * Calculate default validity end date given a start date.
     */
    public static function defaultValidUntil(CarbonInterface $validFrom): CarbonImmutable
    {
        return CarbonImmutable::instance($validFrom)->addDays(self::MAX_VALIDITY_DAYS - 1)->endOfDay();
    }
}
