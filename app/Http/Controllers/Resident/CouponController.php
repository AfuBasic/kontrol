<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext,
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $coupons = Coupon::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->where(function ($q) use ($user, $estate) {
                $q->where(fn ($sub) => $sub->whereNull('estate_id')->whereNull('user_id'))
                    ->orWhere('estate_id', $estate->id)
                    ->orWhere('user_id', $user->id);
            })
            ->get()
            ->filter(fn ($coupon) => ! $coupon->isLimitReached($user))
            ->map(fn ($coupon) => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'campaign_name' => $coupon->campaign_name,
                'description' => $coupon->description,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'formatted_value' => $coupon->type === 'percentage' ? "{$coupon->value}%" : '₦'.number_format($coupon->value / 100),
                'min_purchase' => $coupon->min_purchase,
                'formatted_min_purchase' => $coupon->min_purchase ? '₦'.number_format($coupon->min_purchase / 100) : null,
                'expires_at' => $coupon->expires_at?->toDateString(),
                'scope' => $coupon->estate_id ? 'estate' : ($coupon->user_id ? 'resident' : 'global'),
                'personal_limit' => ($coupon->estate_id !== null || $coupon->user_id !== null) ? $coupon->usage_limit : $coupon->totalUsageLimit(),
                'personal_uses' => ($coupon->estate_id !== null || $coupon->user_id !== null)
                    ? $coupon->logs()->where('user_id', $user->id)->count()
                    : $coupon->logs()->count(),
            ])
            ->values();

        return Inertia::render('Resident/Coupons/Index', [
            'coupons' => $coupons,
        ]);
    }
}
