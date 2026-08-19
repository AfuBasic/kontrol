<?php

namespace App\Enums;

enum SecurityEventSeverity: string
{
    case Info = 'info';
    case Elevated = 'elevated';
    case High = 'high';

    public function label(): string
    {
        return match ($this) {
            self::Info => 'Info',
            self::Elevated => 'Elevated',
            self::High => 'High',
        };
    }
}
