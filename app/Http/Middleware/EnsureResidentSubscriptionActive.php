<?php

namespace App\Http\Middleware;

use App\Models\Estate;
use App\Services\ResidentSubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureResidentSubscriptionActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        // Get the current estate from the request or session
        // Assuming current_estate_id is stored in session or we can infer it
        $estateId = $request->route('estate')?->id ?? session('current_estate_id');
        $estate = $estateId ? Estate::find($estateId) : $user->estates()->first();

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

            if (! $subscription || ! $subscription->isActive()) {
                $message = $user->isHouseholdMember()
                    ? 'Your access is currently limited because the primary resident\'s subscription is inactive.'
                    : 'Your access is currently limited due to an inactive subscription. Please visit the billing section to restore access.';

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 403);
                }

                return back()->with('error', $message);
            }
        }

        return $next($request);
    }
}
