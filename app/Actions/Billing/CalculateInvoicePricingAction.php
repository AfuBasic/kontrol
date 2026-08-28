<?php

namespace App\Actions\Billing;

use App\Models\Coupon;
use App\Models\CouponLog;
use App\Models\Estate;
use App\Models\User;
use App\Services\CouponService;

class CalculateInvoicePricingAction
{
    public function __construct(
        private CouponService $couponService,
    ) {}

    /**
     * Authoritatively calculate the subtotal, discount, and final amount for an invoice,
     * ensuring the coupon is still valid for the given subscriber context.
     *
     * @param  int  $subtotal  Original amount before discount in kobo
     * @param  Coupon|null  $coupon  The coupon to apply
     * @param  User  $user  The user receiving the invoice
     * @param  Estate  $estate  The estate the user belongs to
     * @param  object|null  $subscription  The resident or estate subscription model, for tracking cycles
     * @return array{subtotal: int, discount_amount: int, amount: int, coupon_code: string|null, metadata: array}
     */
    public function execute(
        int $subtotal,
        ?Coupon $coupon,
        User $user,
        Estate $estate,
        $subscription = null,
        bool $isRecurringRenewal = false
    ): array {
        if (! $coupon) {
            return [
                'subtotal' => $subtotal,
                'discount_amount' => 0,
                'amount' => max(0, $subtotal),
                'coupon_code' => null,
                'metadata' => [
                    'subtotal' => $subtotal,
                ],
            ];
        }

        // Validate the coupon
        // Check if expired, reached limits, etc.
        $validation = $this->couponService->validate($coupon->code, $user, $estate);

        if ($validation['status'] !== 'success') {
            // Coupon is invalid. Fallback to no discount.
            return [
                'subtotal' => $subtotal,
                'discount_amount' => 0,
                'amount' => max(0, $subtotal),
                'coupon_code' => null,
                'metadata' => [
                    'subtotal' => $subtotal,
                    'coupon_error' => $validation['message'] ?? 'Invalid coupon.',
                ],
            ];
        }

        // Evaluate recurring cycle limits if it's a recurring coupon
        if ($coupon->is_recurring && $coupon->billing_cycles !== null && $subscription) {
            $subscriptionClass = get_class($subscription);
            // Count consumed cycles
            $consumedCycles = CouponLog::where('coupon_id', $coupon->id)
                ->where('subscription_id', $subscription->id)
                ->where('subscription_type', $subscriptionClass)
                ->count();

            if ($consumedCycles >= $coupon->billing_cycles) {
                // Limit reached. No discount applies.
                return [
                    'subtotal' => $subtotal,
                    'discount_amount' => 0,
                    'amount' => max(0, $subtotal),
                    'coupon_code' => null,
                    'metadata' => [
                        'subtotal' => $subtotal,
                        'coupon_error' => 'Coupon billing cycle limit reached.',
                    ],
                ];
            }
        } elseif (! $coupon->is_recurring && $subscription) {
            // Check if this is an automated recurring renewal (where a non-recurring coupon attached to the subscription must only apply for cycle 1)
            $isAutomatedRenewal = $isRecurringRenewal ?? false;
            $consumedCycles = CouponLog::where('coupon_id', $coupon->id)
                ->where('subscription_id', $subscription->id)
                ->where('subscription_type', get_class($subscription))
                ->count();

            if ($isAutomatedRenewal && $consumedCycles >= 1) {
                return [
                    'subtotal' => $subtotal,
                    'discount_amount' => 0,
                    'amount' => max(0, $subtotal),
                    'coupon_code' => null,
                    'metadata' => [
                        'subtotal' => $subtotal,
                        'coupon_error' => 'Coupon can only be used once per subscription.',
                    ],
                ];
            }

            // For manual checkout, enforce coupon usage_limit if defined
            if ($coupon->usage_limit !== null && $consumedCycles >= $coupon->usage_limit) {
                return [
                    'subtotal' => $subtotal,
                    'discount_amount' => 0,
                    'amount' => max(0, $subtotal),
                    'coupon_code' => null,
                    'metadata' => [
                        'subtotal' => $subtotal,
                        'coupon_error' => 'Coupon usage limit reached.',
                    ],
                ];
            }
        }

        // Calculate discount
        $discountAmount = $coupon->calculateDiscount($subtotal);
        $finalAmount = max(0, $subtotal - $discountAmount);

        return [
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'amount' => $finalAmount,
            'coupon_code' => $coupon->code,
            'metadata' => [
                'coupon_code' => $coupon->code,
                'discount_amount' => $discountAmount,
                'subtotal' => $subtotal,
            ],
        ];
    }
}
