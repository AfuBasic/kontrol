<?php

namespace App\Enums;

enum TransactionType: string
{
    case CollectionPayment = 'collection_payment';
    case OfflinePayment = 'offline_payment';
    case BankTransfer = 'bank_transfer';
    case CardPayment = 'card_payment';
    case Refund = 'refund';
    case CouponRedemption = 'coupon_redemption';
    case DiscountApplied = 'discount_applied';
    case WaiverGranted = 'waiver_granted';
    case ManualAdjustment = 'manual_adjustment';
    case Credit = 'credit';
    case Debit = 'debit';
    case FailedPayment = 'failed_payment';
    case PendingPayment = 'pending_payment';
    case CancelledPayment = 'cancelled_payment';
    case ReversedPayment = 'reversed_payment';
    case ChargeCreated = 'charge_created';
    case ChargeUpdated = 'charge_updated';
    case SubscriptionPayment = 'subscription_payment';

    public function label(): string
    {
        return match ($this) {
            self::CollectionPayment => 'Collection Payment',
            self::OfflinePayment => 'Offline Payment',
            self::BankTransfer => 'Bank Transfer',
            self::CardPayment => 'Card Payment',
            self::Refund => 'Refund',
            self::CouponRedemption => 'Coupon Redemption',
            self::DiscountApplied => 'Discount Applied',
            self::WaiverGranted => 'Waiver Granted',
            self::ManualAdjustment => 'Manual Adjustment',
            self::Credit => 'Credit',
            self::Debit => 'Debit',
            self::FailedPayment => 'Failed Payment',
            self::PendingPayment => 'Pending Payment',
            self::CancelledPayment => 'Cancelled Payment',
            self::ReversedPayment => 'Reversed Payment',
            self::ChargeCreated => 'Charge Created',
            self::ChargeUpdated => 'Charge Updated',
            self::SubscriptionPayment => 'Subscription Payment',
        };
    }

    public function isInbound(): bool
    {
        return match ($this) {
            self::CollectionPayment,
            self::OfflinePayment,
            self::BankTransfer,
            self::CardPayment,
            self::Credit,
            self::SubscriptionPayment,
            self::ChargeCreated => true,
            default => false,
        };
    }

    public function isOutbound(): bool
    {
        return match ($this) {
            self::Refund,
            self::Debit,
            self::ReversedPayment,
            self::WaiverGranted => true,
            default => false,
        };
    }
}
