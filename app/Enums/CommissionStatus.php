<?php

namespace App\Enums;

enum CommissionStatus: string
{
    case Inactive = 'inactive';
    case Active = 'active';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Inactive => 'Inactive',
            self::Active => 'Active',
            self::Expired => 'Expired',
        };
    }
}
