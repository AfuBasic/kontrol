<?php

namespace App\Enums;

enum TransactionDirection: string
{
    case Credit = 'credit';
    case Debit = 'debit';

    public function label(): string
    {
        return match ($this) {
            self::Credit => 'Money In',
            self::Debit => 'Money Out',
        };
    }

    public function multiplier(): int
    {
        return match ($this) {
            self::Credit => 1,
            self::Debit => -1,
        };
    }
}
