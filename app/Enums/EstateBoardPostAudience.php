<?php

namespace App\Enums;

enum EstateBoardPostAudience: string
{
    case All = 'all';
    case Residents = 'residents';
    case Security = 'security';

    public function label(): string
    {
        return match ($this) {
            self::All => 'All',
            self::Residents => 'Residents Only',
            self::Security => 'Security Only',
        };
    }
}
