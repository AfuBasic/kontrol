<?php

namespace App\Enums;

enum PartnerStatus: string
{
    case Lead = 'lead';
    case Submitted = 'submitted';
    case Reviewing = 'reviewing';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case EstateCreated = 'estate_created';
    case Activated = 'activated';
    case CommissionActive = 'commission_active';
    case CommissionExpired = 'commission_expired';

    public function label(): string
    {
        return match ($this) {
            self::Lead => 'Lead',
            self::Submitted => 'Submitted',
            self::Reviewing => 'Reviewing',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::EstateCreated => 'Estate Created',
            self::Activated => 'Activated',
            self::CommissionActive => 'Commission Active',
            self::CommissionExpired => 'Commission Expired',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function timelineOrder(): array
    {
        return [
            self::Lead->value,
            self::Submitted->value,
            self::Reviewing->value,
            self::Approved->value,
            self::EstateCreated->value,
            self::Activated->value,
            self::CommissionActive->value,
            self::CommissionExpired->value,
        ];
    }
}
