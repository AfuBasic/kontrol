<?php

namespace App\Services\Zeus;

use App\Models\Coupon;
use App\Models\Estate;
use App\Models\PaymentTransaction;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EstateHealthService
{
    /**
     * Calculate an estate's health score (0-100).
     */
    public function calculateHealthScore(Estate $estate): int
    {
        $score = 100;

        $communityQuery = $estate->users()
            ->wherePivot('status', 'accepted')
            ->where(function ($rq) {
                $rq->whereIn('estate_users_membership.relationship_type', ['resident', 'property_owner'])
                    ->orWhere(function ($sub) {
                        $sub->whereNull('estate_users_membership.relationship_type')
                            ->whereExists(function ($roleSub) {
                                $roleSub->select(DB::raw(1))
                                    ->from('model_has_roles')
                                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                                    ->whereColumn('model_has_roles.model_id', 'users.id')
                                    ->where('model_has_roles.model_type', User::class)
                                    ->whereColumn('model_has_roles.estate_id', 'estate_users_membership.estate_id')
                                    ->whereIn('roles.name', ['resident', 'property_owner']);
                            });
                    });
            })
            ->where(function ($sub) {
                $sub->where('estate_users_membership.relationship_type', '!=', 'security')
                    ->orWhereNull('estate_users_membership.relationship_type');
            });

        $totalResidents = (clone $communityQuery)->count();

        if ($totalResidents > 0) {
            $activeResidents = (clone $communityQuery)
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
                'users as total_residents' => fn ($q) => $q->where('estate_users_membership.status', 'accepted')
                    ->where(function ($rq) {
                        $rq->whereIn('estate_users_membership.relationship_type', ['resident', 'property_owner'])
                            ->orWhere(function ($sub) {
                                $sub->whereNull('estate_users_membership.relationship_type')
                                    ->whereExists(function ($roleSub) {
                                        $roleSub->select(DB::raw(1))
                                            ->from('model_has_roles')
                                            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                                            ->whereColumn('model_has_roles.model_id', 'users.id')
                                            ->where('model_has_roles.model_type', User::class)
                                            ->whereColumn('model_has_roles.estate_id', 'estate_users_membership.estate_id')
                                            ->whereIn('roles.name', ['resident', 'property_owner']);
                                    });
                            });
                    })->where(function ($sub) {
                        $sub->where('estate_users_membership.relationship_type', '!=', 'security')
                            ->orWhereNull('estate_users_membership.relationship_type');
                    }),
                'users as total_security' => fn ($q) => $q->where('estate_users_membership.status', 'accepted')
                    ->where(function ($sq) {
                        $sq->where('estate_users_membership.relationship_type', 'security')
                            ->orWhereExists(function ($roleSub) {
                                $roleSub->select(DB::raw(1))
                                    ->from('model_has_roles')
                                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                                    ->whereColumn('model_has_roles.model_id', 'users.id')
                                    ->where('model_has_roles.model_type', User::class)
                                    ->whereColumn('model_has_roles.estate_id', 'estate_users_membership.estate_id')
                                    ->where('roles.name', 'security');
                            });
                    }),
                'collections as total_collections',
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
                    'total_security' => $estate->total_security ?? 0,
                    'total_collections' => $estate->total_collections ?? 0,
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
