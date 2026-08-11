<?php

namespace App\Http\Middleware;

use App\Auth\ContextManager;
use App\Http\Controllers\Partner\NotificationController;
use App\Models\Coupon;
use App\Models\Estate;
use App\Models\Invoice;
use App\Models\ZeusNotification;
use App\Services\Platform\AndroidMigrationService;
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

        $partnerContext = null;
        $partnerNotifications = [];
        $partnerUnreadCount = 0;

        if ($user) {
            $contextManager = app(ContextManager::class);
            $currentContext = $contextManager->current();

            if ($currentContext) {
                // The ContextManager has already established the Spatie team ID and cleared caches
                $estate = Estate::find($currentContext->estateId);
                $user->loadMissing('profile');
                $permissions = $user->getAllPermissions()->map(fn ($p) => ['name' => $p['name']])->values()->all();
                $roles = $user->getRoleNames()->toArray();
            } else {
                // If no active context, safely provide empty roles/permissions
                $user->loadMissing('profile');
                $permissions = [];
                $roles = [];
            }

            if ($user->partner_id) {
                $user->loadMissing('partner');
                $partner = $user->partner;

                if ($partner) {
                    $partnerContext = [
                        'name' => $partner->name,
                        'status' => $partner->status,
                        'commission_rate' => $partner->commission_rate !== null
                            ? (string) $partner->commission_rate
                            : null,
                        'commission_type' => $partner->commission_type,
                    ];
                }

                $partnerUnreadCount = $user->unreadNotifications()->count();
                $partnerNotifications = $user->notifications()
                    ->latest()
                    ->take(8)
                    ->get()
                    ->map(fn ($notification) => NotificationController::transform($notification))
                    ->values()
                    ->all();
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'partnerContext' => $partnerContext,
            'partnerNotifications' => $partnerNotifications,
            'partnerUnreadCount' => $partnerUnreadCount,
            'zeusUnreadNotificationsCount' => $request->session()->get(config('zeus.session_key'))
                ? ZeusNotification::query()->unread()->count()
                : 0,
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
                        return Coupon::query()
                            ->availableTo($user, $estate)
                            ->get()
                            ->filter(fn ($coupon) => ! $coupon->isLimitReached($user))
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
            'platform' => [
                'is_pwa_installed' => $request->header('X-PWA-Standalone') === 'true',
                'android_native_available' => (bool) config('platform.android_native_available'),
                'app_store_url' => config('platform.app_store_url'),
                'play_store_url' => config('platform.play_store_url'),
                'migration' => $user ? app(AndroidMigrationService::class)->getMigrationData($request, $user) : null,
            ],
        ];
    }
}
