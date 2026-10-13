<?php

namespace App\Support;

use App\Models\UserClient;
use App\Services\Platform\PlatformDetectionService;
use Illuminate\Http\Request;

/**
 * What a request says about the device behind it, in the terms the Audience figures count: which platform, which
 * operating system and, for the store apps, which version. Only these few words are kept, never the user agent.
 */
final class ClientPlatform
{
    private const VERSION = '/^[0-9A-Za-z][0-9A-Za-z.+_-]{0,31}$/';

    private function __construct(
        public readonly string $platform,
        public readonly string $os,
        public readonly string $deviceType,
        public readonly string $browser,
        public readonly ?string $appVersion,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $context = app(PlatformDetectionService::class)->detect($request);
        $userAgent = (string) $request->userAgent();

        // The store apps say what they are in headers. A loose guess from the user agent is not enough to call a
        // phone browser "the app", so only the app's own marks count.
        $reported = strtolower((string) $request->header('X-App-Platform'));
        $reported = in_array($reported, ['ios', 'android'], true) ? $reported : null;
        $native = $reported !== null || $request->header('X-Capacitor-App') === 'true' || str_contains($userAgent, 'KontrolApp');

        $platform = match (true) {
            $native => UserClient::NATIVE,
            $context->isInstalledPwa => UserClient::PWA,
            $context->deviceType !== 'desktop' => UserClient::MOBILE_WEB,
            default => UserClient::DESKTOP_WEB,
        };

        $version = (string) $request->header('X-App-Version');

        return new self(
            platform: $platform,
            // An iPad can present itself as a Mac, so the app's own word wins over the user agent.
            os: $native && $reported !== null ? $reported : $context->operatingSystem,
            deviceType: $context->deviceType,
            browser: $native ? 'app' : $context->browserName,
            appVersion: $native && preg_match(self::VERSION, $version) ? $version : null,
        );
    }

    /** Changes when anything worth recording changes, so an unchanged client is not written again. */
    public function fingerprint(?string $rememberedVersion = null): string
    {
        return implode('|', [$this->platform, $this->os, $this->browser, $this->appVersion ?? $rememberedVersion ?? '']);
    }
}
