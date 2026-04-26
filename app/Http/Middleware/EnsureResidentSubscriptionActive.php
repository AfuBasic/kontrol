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
            $subscription = $user->residentSubscription()->where('estate_id', $estate->id)->first();

            // If no subscription exists, create one (grace period by default)
            if (! $subscription) {
                $service = app(ResidentSubscriptionService::class);
                $subscription = $service->createForUser($user, $estate);
            }

            if (! $subscription || ! $subscription->isActive()) {
                $message = 'Your access is currently limited due to an inactive subscription. Please visit the billing section to restore access.';

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 403);
                }

                return back()->with('error', $message);
            }
        }

        return $next($request);
    }
}
