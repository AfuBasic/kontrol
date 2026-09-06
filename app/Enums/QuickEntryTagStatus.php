<?php

namespace App\Enums;

enum QuickEntryTagStatus: string
{
    case Available = 'available';
    case Used = 'used';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Available',
            self::Used => 'Used',
            self::Expired => 'Expired',
        };
    }
}
