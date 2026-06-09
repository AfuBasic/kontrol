<?php

namespace App\Enums;

enum IncidentStatus: string
{
    case Pending = 'pending';
    case Acknowledged = 'acknowledged';
    case Resolving = 'resolving';
    case Solved = 'solved';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Acknowledged => 'Acknowledged',
            self::Resolving => 'Resolving',
            self::Solved => 'Solved',
            self::Closed => 'Closed',
        };
    }
}
