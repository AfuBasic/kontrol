<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Online = 'online';
    case Card = 'card';
    case BankTransfer = 'bank_transfer';
    case Manual = 'manual';
    case Offline = 'offline';
    case Paystack = 'paystack';
    case Cash = 'cash';
    case Coupon = 'coupon';
    case System = 'system';

    public function label(): string
    {
        return match ($this) {
            self::Online => 'Online',
            self::Card => 'Card',
            self::BankTransfer => 'Bank Transfer',
            self::Manual => 'Manual',
            self::Offline => 'Offline',
            self::Paystack => 'Paystack',
            self::Cash => 'Cash',
            self::Coupon => 'Coupon',
            self::System => 'System',
        };
    }
}
