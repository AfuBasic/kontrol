<?php

namespace App\Http\Middleware;

use App\Models\Estate;
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

            if (! $subscription || ! $subscription->isActive()) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Your access is currently limited. Please visit the Kontrol web platform to manage your subscription.',
                    ], 403);
                }

                return back()->with('error', 'Your access is currently limited. Please visit the Kontrol web platform to manage your subscription.');
            }
        }

        return $next($request);
    }
}
