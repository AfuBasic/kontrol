<?php

namespace App\Enums;

enum AccessCodeStatus: string
{
    case Active = 'active';
    case Scheduled = 'scheduled';
    case Used = 'used';
    case Expired = 'expired';
    case Revoked = 'revoked';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Scheduled => 'Scheduled',
            self::Used => 'Used',
            self::Expired => 'Expired',
            self::Revoked => 'Revoked',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Active => 'emerald',
            self::Scheduled => 'indigo',
            self::Used => 'blue',
            self::Expired => 'gray',
            self::Revoked => 'red',
        };
    }
}
