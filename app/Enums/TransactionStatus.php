<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Pending = 'pending';
    case Success = 'success';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
    case Reversed = 'reversed';
    case Partial = 'partial';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Success => 'Successful',
            self::Failed => 'Failed',
            self::Cancelled => 'Cancelled',
            self::Reversed => 'Reversed',
            self::Partial => 'Partial',
        };
    }
}
