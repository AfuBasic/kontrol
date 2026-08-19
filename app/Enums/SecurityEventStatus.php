<?php

namespace App\Enums;

enum SecurityEventStatus: string
{
    case Pending = 'pending';
    case Resolved = 'resolved';
    case Denied = 'denied';
    case Blocked = 'blocked';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Verification pending',
            self::Resolved => 'Resolved',
            self::Denied => 'Denied',
            self::Blocked => 'Blocked',
        };
    }

    public function requiresAttention(): bool
    {
        return in_array($this, [self::Pending, self::Denied, self::Blocked], true);
    }
}
