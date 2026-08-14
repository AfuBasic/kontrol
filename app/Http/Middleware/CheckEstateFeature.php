<?php

namespace App\Http\Middleware;

use App\Services\EstateContextService;
use Closure;
use Exception;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckEstateFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $featureSlug): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403, 'Unauthorized.');
        }

        // Get the current estate from context service (more robust than first())
        try {
            $estate = app(EstateContextService::class)->getEstate();
        } catch (Exception $e) {
            abort(403, 'No estate access.');
        }

        if (! $estate) {
            abort(403, 'No estate access.');
        }

        // Check resident's personal subscription if in resident billing mode
        if ($user->user_type !== 'affiliate' && $estate->settings->charge_type === 'residents') {
            $subject = $user;
            if ($user->isHouseholdMember() && $user->householdOf) {
                $subject = $user->householdOf->primaryResident;
            }

            $residentSub = $subject->residentSubscription()
                ->where('estate_id', $estate->id)
                ->first();

            // If subscription exists and has a plan, check the plan's features
            if ($residentSub && $residentSub->plan_id && $residentSub->plan) {
                if (! $residentSub->plan->hasFeature($featureSlug)) {
                    abort(403, 'Feature not available on your current plan tier.');
                }
            } elseif ($residentSub && $residentSub->plan_id && ! $residentSub->plan) {
                // Plan was deleted - treat as feature unavailable
                abort(403, 'Feature not available on your current plan tier.');
            }
            // No plan yet: let them through (grace period / newly subscribed user)
        } elseif (! $estate->hasFeature($featureSlug)) {
            // Estate admins/security/affiliates use estate-level features
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Feature locked. Upgrade your plan to access this feature.'], 403);
            }
            abort(403, 'Feature locked. Upgrade your plan to access this feature.');
        }

        return $next($request);
    }
}
