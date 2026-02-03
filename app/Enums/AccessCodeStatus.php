<?php

namespace App\Enums;

enum AccessCodeStatus: string
{
    case Active = 'active';
    case Used = 'used';
    case Expired = 'expired';
    case Revoked = 'revoked';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Used => 'Used',
            self::Expired => 'Expired',
            self::Revoked => 'Revoked',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Active => 'emerald',
            self::Used => 'blue',
            self::Expired => 'gray',
            self::Revoked => 'red',
        };
    }
}
