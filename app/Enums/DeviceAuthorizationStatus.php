<?php

namespace App\Enums;

enum DeviceAuthorizationStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Denied = 'denied';
    case Expired = 'expired';
    case Consumed = 'consumed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Verification pending',
            self::Approved => 'Approved',
            self::Denied => 'Denied',
            self::Expired => 'Expired',
            self::Consumed => 'Completed',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Denied, self::Expired, self::Consumed], true);
    }
}
