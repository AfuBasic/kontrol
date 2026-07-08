<?php

namespace App\Enums;

enum PartnerRequestStatus: string
{
    case Submitted = 'submitted';
    case Reviewing = 'reviewing';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case InfoRequested = 'info_requested';
    case EstateCreated = 'estate_created';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Submitted',
            self::Reviewing => 'Reviewing',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::InfoRequested => 'Info Requested',
            self::EstateCreated => 'Estate Created',
        };
    }
}
