<?php

namespace App\Http\Middleware;

use App\Auth\ContextManager;
use App\Models\Estate;
use App\Services\OrganizationContextService;
use App\Services\ResidentSubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureResidentSubscriptionActive
{
    /**
     * Routes a resident can still reach once their subscription has lapsed.
     * Everything else under the resident area is locked until they settle.
     * Matched with Request::routeIs(), so wildcards are allowed.
     *
     * @var array<int, string>
     */
    public const ALLOWED_WHEN_LAPSED = [
        'resident.home',
        'resident.dashboard',
        'resident.profile',
        'resident.profile.update',
        'resident.password.update',
        'resident.collections.*',
        'resident.coupons.index',
        'resident.notifications.*',
        'resident.sos.*',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $mode = ''): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        if ($user->contextHasRole(['admin', 'property_owner'])) {
            return $next($request);
        }

        // When called with `resident.active:force` (e.g. on org routes), check the
        // organization's subscription if in org context, otherwise check user's resident subscription.
        if ($mode === 'force') {
            $org = $request->attributes->get('organization');
            if (! $org) {
                try {
                    $org = app(OrganizationContextService::class)->getOrganization();
                } catch (\Throwable) {
                    $org = null;
                }
            }

            $hasActiveSub = $org
                ? $org->hasActiveSubscription($user)
                : ($user->residentSubscription && $user->residentSubscription->isActive());

            if (! $hasActiveSub) {
                $message = 'An active subscription is required to perform this action.';

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 403);
                }

                return back()->with('error', $message);
            }

            return $next($request);
        }

        $context = app(ContextManager::class)->current();
        if (! $context) {
            return $next($request);
        }

        $estateId = $context->estateId;
        $estate = Estate::find($estateId);

        if ($estate && $estate->settings->charge_type === 'residents') {
            // Determine whose subscription we are checking
            $subject = $user;
            if ($user->isHouseholdMember() && $user->householdOf) {
                $subject = $user->householdOf->primaryResident;
            }

            $subscription = $subject->residentSubscription()->where('estate_id', $estate->id)->first();

            // If no subscription exists for primary resident, create one (grace period by default)
            if (! $subscription && $subject->isPrimaryResident()) {
                $service = app(ResidentSubscriptionService::class);
                $subscription = $service->createForUser($subject, $estate);
            }

            if ((! $subscription || ! $subscription->isActive()) && ! $request->routeIs(...self::ALLOWED_WHEN_LAPSED)) {
                $message = $user->isHouseholdMember()
                    ? 'Your access is currently restricted.'
                    : 'Your access is currently limited due to an inactive subscription. Please visit the billing section to restore access.';

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 403);
                }

                // A locked page reached by navigation goes home with the explanation, not back to a dead end.
                if ($request->isMethod('GET') && $request->routeIs('resident.*')) {
                    return redirect()->route('resident.home')->with('error', $message);
                }

                return back()->with('error', $message);
            }
        }

        return $next($request);
    }
}
