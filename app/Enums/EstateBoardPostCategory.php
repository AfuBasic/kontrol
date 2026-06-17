<?php

namespace App\Enums;

enum EstateBoardPostCategory: string
{
    case General = 'general';
    case Meeting = 'meeting';
    case Maintenance = 'maintenance';
    case Security = 'security';
    case Event = 'event';

    public function label(): string
    {
        return match ($this) {
            self::General => 'General',
            self::Meeting => 'Meeting',
            self::Maintenance => 'Maintenance',
            self::Security => 'Security',
            self::Event => 'Event',
        };
    }
}
