<?php

namespace App\Services\Zeus;

use App\Models\Coupon;
use App\Models\Estate;
use App\Models\PaymentTransaction;
use App\Models\Property;
use Illuminate\Support\Collection;

class EstateHealthService
{
    /**
     * Calculate an estate's health score (0-100).
     */
    public function calculateHealthScore(Estate $estate): int
    {
        $score = 100;

        $totalResidents = $estate->users()
            ->whereHas('roles', fn ($q) => $q->where('name', 'resident'))
            ->count();

        if ($totalResidents > 0) {
            $activeResidents = $estate->users()
                ->whereHas('roles', fn ($q) => $q->where('name', 'resident'))
                ->whereNotNull('email_verified_at')
                ->whereNull('suspended_at')
                ->count();

            $onboardingRatio = $activeResidents / $totalResidents;
            $score -= (40 - (40 * $onboardingRatio));
        } else {
            $score -= 20;
        }

        $totalPayments = PaymentTransaction::where('estate_id', $estate->id)->count();
        if ($totalPayments > 0) {
            $failedPayments = PaymentTransaction::where('estate_id', $estate->id)
                ->where('status', 'failed')
                ->count();

            $failureRatio = $failedPayments / $totalPayments;
            $score -= (60 * $failureRatio);
        }

        return (int) max(0, min(100, round($score)));
    }

    /**
     * Get rich geospatial and demographic data for Estate Explorer.
     */
    public function getEstateExplorerData(array $filters = []): Collection
    {
        $query = Estate::query()
            ->with(['settings'])
            ->withCount([
                'users as total_residents' => fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', 'resident')),
            ]);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()
            ->get()
            ->map(function (Estate $estate) {
                // Manually count properties if relation is missing or not eager loaded correctly
                $totalProperties = Property::where('estate_id', $estate->id)->count();

                $mrr = 0;
                // Basic MRR placeholder logic based on total residents
                $mrr = $estate->total_residents * 5000; // Placeholder

                $hasActiveCoupons = Coupon::where('estate_id', $estate->id)
                    ->where('status', 'active')
                    ->withinValidityPeriod()
                    ->exists();

                return [
                    'id' => $estate->id,
                    'ulid' => $estate->ulid,
                    'name' => $estate->name,
                    'address' => $estate->address ?? 'Location not specified',
                    'status' => $estate->status,
                    'billing_mode' => $estate->billing_mode,
                    'total_residents' => $estate->total_residents,
                    'total_properties' => $totalProperties,
                    'health_score' => $this->calculateHealthScore($estate),
                    'mrr' => $mrr,
                    'has_active_coupons' => $hasActiveCoupons,
                    'has_admin' => $estate->hasAcceptedAdmin(),
                    'created_at' => $estate->created_at->toISOString(),
                ];
            });
    }
}
