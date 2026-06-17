<?php

namespace App\Enums;

enum EstateBoardPostPriority: string
{
    case Normal = 'normal';
    case Important = 'important';
    case Critical = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::Normal => 'Normal',
            self::Important => 'Important',
            self::Critical => 'Critical',
        };
    }
}
