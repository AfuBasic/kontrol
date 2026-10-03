<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Makes a write safe to send twice.
 *
 * The offline queue stamps every saved action with a unique `X-Idempotency-Key` and keeps retrying it
 * until it hears back. On a bad connection the server can receive and finish the action while the
 * reply is lost, so the retry arrives for something already done. This answers that retry with "got it"
 * instead of creating a second pass, incident or log.
 *
 * Requests without the header are untouched.
 */
class EnsureIdempotent
{
    /** How long a finished action is remembered: longer than the offline queue keeps retrying (7 days). */
    private const REMEMBER_FOR = 8 * 24 * 60 * 60;

    /** How long a first attempt may keep the others waiting before it is assumed to have died. */
    private const LOCK_SECONDS = 120;

    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('X-Idempotency-Key');

        if (! is_string($key) || ! preg_match('/^[A-Za-z0-9_-]{16,100}$/', $key)) {
            return $next($request);
        }

        // Scoped to the person and the endpoint, so one person's key can never answer for another's.
        $fingerprint = hash('sha256', ($request->user()?->getAuthIdentifier() ?? 'guest').'|'.$request->method().'|'.$request->path().'|'.$key);
        $doneKey = "idempotency:done:{$fingerprint}";
        $lockKey = "idempotency:lock:{$fingerprint}";

        if (Cache::has($doneKey)) {
            return response()->json(['success' => true, 'duplicate' => true, 'message' => 'Already received.']);
        }

        // The first attempt is still running: ask the queue to come back, never run it twice side by side.
        if (! Cache::add($lockKey, 1, self::LOCK_SECONDS)) {
            return response()->json(
                ['success' => false, 'retryable' => true, 'error' => 'The first attempt is still being processed.'],
                503,
                ['Retry-After' => 10],
            );
        }

        try {
            $response = $next($request);

            // Only a finished action is remembered. A failed one must stay free to be tried again.
            if ($response->isSuccessful() || $response->isRedirection()) {
                Cache::put($doneKey, true, self::REMEMBER_FOR);
            }

            return $response;
        } finally {
            Cache::forget($lockKey);
        }
    }
}
