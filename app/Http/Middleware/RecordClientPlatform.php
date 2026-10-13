<?php

namespace App\Http\Middleware;

use App\Actions\Platform\RecordUserClient;
use App\Services\Zeus\ImpersonationService;
use App\Support\ClientPlatform;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Notes which kind of device a signed-in person is using, for the Audience figures in Zeus.
 *
 * It costs nothing on most requests: the last thing written is remembered in the session, which is already loaded,
 * so the database is only touched when the client changes or about once every fifteen minutes. The write itself runs
 * after the response has gone, and a failure to record is reported and never reaches the person.
 */
class RecordClientPlatform
{
    private const SESSION_KEY = 'client_platform';

    /** How often an unchanged client is written again, so "last seen" stays roughly right. */
    private const REFRESH_SECONDS = 900;

    public function __construct(private RecordUserClient $record) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->note($request);

        return $next($request);
    }

    private function note(Request $request): void
    {
        $user = Auth::user();

        // Zeus looking at someone's account is not that person using the app.
        if (! $user || ! $request->hasSession() || $request->session()->has(ImpersonationService::SESSION_ID_KEY)) {
            return;
        }

        try {
            $client = ClientPlatform::fromRequest($request);
            $seen = $request->session()->get(self::SESSION_KEY);
            $fingerprint = $client->fingerprint($seen['version'] ?? null);

            if (($seen['fingerprint'] ?? null) === $fingerprint && now()->timestamp - ($seen['at'] ?? 0) < self::REFRESH_SECONDS) {
                return;
            }

            $request->session()->put(self::SESSION_KEY, [
                'fingerprint' => $fingerprint,
                'at' => now()->timestamp,
                'version' => $client->appVersion ?? $seen['version'] ?? null,
            ]);

            defer(function () use ($user, $client) {
                try {
                    $this->record->execute($user, $client);
                } catch (Throwable $e) {
                    report($e);
                }
            });
        } catch (Throwable $e) {
            report($e);
        }
    }
}
