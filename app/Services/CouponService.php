<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\CouponLog;
use App\Models\Estate;
use App\Models\EstateSubscription;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CouponService
{
    /**
     * Validate a coupon code for a specific user and estate.
     *
     * @return array{status: string, message?: string, coupon?: Coupon}
     */
    public function validate(string $code, User $user, Estate $estate, ?Plan $plan = null): array
    {
        $code = strtoupper(trim($code));

        $coupon = Coupon::where('code', $code)->first();

        if (! $coupon) {
            return [
                'status' => 'error',
                'message' => 'Invalid coupon code.',
            ];
        }

        if ($coupon->status !== 'active') {
            return [
                'status' => 'error',
                'message' => 'This coupon is no longer active.',
            ];
        }

        if ($coupon->isScheduled()) {
            return [
                'status' => 'error',
                'message' => 'This coupon is not yet valid.',
            ];
        }

        if ($coupon->isExpired()) {
            return [
                'status' => 'error',
                'message' => 'This coupon has expired.',
            ];
        }

        if ($coupon->isLimitReached($user)) {
            return [
                'status' => 'error',
                'message' => 'This coupon has reached its usage limit.',
            ];
        }

        if ($coupon->estate_id !== null && $coupon->estate_id !== $estate->id) {
            return [
                'status' => 'error',
                'message' => 'This coupon is not valid for this estate.',
            ];
        }

        if ($coupon->user_id !== null && $coupon->user_id !== $user->id) {
            return [
                'status' => 'error',
                'message' => 'This coupon is not valid for your account.',
            ];
        }

        if ($coupon->zone_id !== null && ! app(ZoneAudienceResolver::class)->userBelongsToZone($user, $estate, (int) $coupon->zone_id)) {
            return [
                'status' => 'error',
                'message' => 'This coupon is not valid for your zone.',
            ];
        }

        if ($plan && ! empty($coupon->eligible_plans) && ! in_array($plan->id, $coupon->eligible_plans)) {
            return [
                'status' => 'error',
                'message' => 'This coupon is not valid for the selected plan.',
            ];
        }

        return [
            'status' => 'success',
            'coupon' => $coupon,
        ];
    }

    /**
     * Apply a coupon to an invoice, creating a log and updating usage count.
     * This should only be called when the invoice/payment is successfully completed/recorded.
     */
    public function logCouponUsage(Invoice $invoice, string $code): ?CouponLog
    {
        $code = strtoupper(trim($code));
        $user = $invoice->user;
        $estate = $invoice->estate;

        if (! $user || ! $estate) {
            return null;
        }

        return DB::transaction(function () use ($invoice, $code, $user, $estate) {
            $validation = $this->validate($code, $user, $estate, $invoice->plan);

            if ($validation['status'] !== 'success') {
                return null;
            }

            /** @var Coupon $coupon */
            $coupon = $validation['coupon'];

            // Calculate the discount based on the original price of the plan
            $originalPrice = $invoice->plan ? $invoice->plan->price : $invoice->amount;
            $discountAmount = $coupon->calculateDiscount($originalPrice);

            // Increment usage
            $coupon->increment('used_count');

            $subscriptionId = null;
            $subscriptionType = null;

            if ($invoice->user_id) {
                $sub = ResidentSubscription::where('user_id', $invoice->user_id)
                    ->where('estate_id', $invoice->estate_id)
                    ->first();
                if ($sub) {
                    $subscriptionId = $sub->id;
                    $subscriptionType = ResidentSubscription::class;
                }
            } elseif (! $invoice->user_id && $invoice->estate && $invoice->estate->subscriptionRecord) {
                $subscriptionId = $invoice->estate->subscriptionRecord->id;
                $subscriptionType = EstateSubscription::class;
            }

            // Log usage (the audit log)
            return CouponLog::create([
                'coupon_id' => $coupon->id,
                'user_id' => $user->id,
                'invoice_id' => $invoice->id,
                'discount_amount' => $discountAmount,
                'subscription_id' => $subscriptionId,
                'subscription_type' => $subscriptionType,
            ]);
        });
    }
}
