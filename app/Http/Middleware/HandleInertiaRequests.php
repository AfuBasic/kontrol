<?php

namespace App\Http\Middleware;

use App\Models\Coupon;
use App\Models\Invoice;
use App\Services\Resident\AccessCodeService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $permissions = [];
        $roles = [];
        $estate = null;

        if ($user) {
            // Set team context for permission check
            $estate = $user->estates()->wherePivot('status', 'accepted')->first();
            if ($estate) {
                setPermissionsTeamId($estate->id);
            }

            $user->loadMissing('profile');
            $permissions = $user->getAllPermissions()->map(fn ($p) => ['name' => $p['name']])->values()->all();
            $roles = $user->getRoleNames()->toArray();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'ulid' => $user->ulid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'permissions' => $permissions,
                    'roles' => $roles,
                    'current_estate_id' => $estate?->id,
                    'current_estate_ulid' => $estate?->ulid,
                    'estate_name' => $estate?->name,
                    'property_owner_id' => $user->profile?->property_owner_id,
                    'unread_notifications_count' => $user->unreadNotifications()->count(),
                    'has_active_coupons' => $estate ? (function () use ($user, $estate) {
                        return Coupon::where('status', 'active')
                            ->where(function ($q) {
                                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                            })
                            ->where(function ($q) use ($user, $estate) {
                                $q->where(fn ($sub) => $sub->whereNull('estate_id')->whereNull('user_id'))
                                  ->orWhere('estate_id', $estate->id)
                                  ->orWhere('user_id', $user->id);
                            })
                            ->get()
                            ->filter(fn ($coupon) => !$coupon->isLimitReached($user))
                            ->isNotEmpty();
                    })() : false,
                    'notifications' => $user->unreadNotifications()->latest()->take(5)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'data' => $n->data,
                        'created_at_human' => $n->created_at->diffForHumans(),
                    ])->values()->all(),
                    'resident_subscription' => ($estate) ? (function () use ($user, $estate) {
                        $subject = $user;
                        $parentName = null;
                        if ($user->isHouseholdMember() && $user->householdOf) {
                            $subject = $user->householdOf->primaryResident;
                            $parentName = $subject->name;
                        }

                        $sub = $subject->residentSubscription()->where('estate_id', $estate->id)->first();
                        if (! $sub) {
                            return null;
                        }

                        $sub->load('estate.subscriptionRecord.plan');

                        return array_merge(
                            $sub->only(['ulid', 'status', 'trial_ends_at', 'current_period_end']),
                            [
                                'is_active' => $sub->isActive(),
                                'is_grace_period' => $sub->isGracePeriod(),
                                'plan_name' => $estate->subscriptionRecord->plan->name ?? 'Standard',
                                'billing_interval' => $estate->subscriptionRecord->billing_interval ?? 'monthly',
                                'is_household_member' => $user->isHouseholdMember(),
                                'parent_resident_name' => $parentName,
                            ]
                        );
                    })() : null,
                ] : null,
            ],
            'estate_plan' => $estate ? [
                'name' => $estate->subscriptionRecord->plan->name ?? 'Free Tier',
                'status' => $estate->subscriptionRecord->status ?? 'none',
                'features' => $estate->getActiveFeatureSlugs(),
                'limits' => [
                    'max_residents' => $estate->subscriptionRecord?->plan?->max_residents,
                    'max_security' => $estate->subscriptionRecord?->plan?->max_security,
                    'max_admins' => $estate->subscriptionRecord?->plan?->max_admins,
                    'max_household_members' => ($limit = $estate->getFeatureLimit('household-management')) !== null ? (int) $limit : null,
                ],
            ] : (object) [],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'sos_success' => $request->session()->get('sos_success'),
                'validation_result' => $request->session()->get('validation_result'),
            ],
            'billing_enabled' => fn () => $estate ? ($estate->settings->charge_type === 'estate') : false,
            'has_overdue_invoice' => fn () => $estate ? Invoice::where('estate_id', $estate->id)->where('status', 'overdue')->exists() : false,
            'webpush_public_key' => config('webpush.vapid.public_key'),
            'access_code_durations' => fn () => $estate ? app(AccessCodeService::class)->getDurationOptions() : [],
            'access_code_constraints' => fn () => $estate ? app(AccessCodeService::class)->getDurationConstraints() : ['min' => 30, 'max' => 1440],
            'unreadCount' => fn () => $user ? $user->unreadNotifications()->count() : 0,
            'app_url' => url('/'),
            'app_subdomain_url' => config('domains.routing_enabled')
                ? request()->getScheme().'://'.config('domains.app')
                : url('/'),
            'is_local' => app()->environment('local'),
        ];
    }
}
