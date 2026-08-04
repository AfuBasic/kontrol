<?php

namespace App\Services\Platform;

use Illuminate\Http\Request;

class PlatformDetectionService
{
    /**
     * Detect platform context from incoming request.
     */
    public function detect(Request $request): PlatformContext
    {
        $ua = $request->header('User-Agent') ?? '';

        $isNativeApp = $this->detectNativeApp($request, $ua);
        $isInstalledPwa = $this->detectInstalledPwa($request);
        $operatingSystem = $this->detectOperatingSystem($ua);
        $browserName = $this->detectBrowserName($ua);
        $deviceType = $this->detectDeviceType($ua);

        $isDesktopBrowser = ($deviceType === 'desktop') && ! $isNativeApp && ! $isInstalledPwa;
        $isMobileBrowser = ($deviceType !== 'desktop') && ! $isNativeApp && ! $isInstalledPwa;

        return new PlatformContext(
            isNativeApp: $isNativeApp,
            isInstalledPwa: $isInstalledPwa,
            isMobileBrowser: $isMobileBrowser,
            isDesktopBrowser: $isDesktopBrowser,
            operatingSystem: $operatingSystem,
            browserName: $browserName,
            deviceType: $deviceType
        );
    }

    protected function detectNativeApp(Request $request, string $ua): bool
    {
        // 1. Explicit Headers & Cookies
        if ($request->header('X-Capacitor-App') === 'true' || $request->cookie('is_native_app') === 'true') {
            return true;
        }

        // 2. UA strings
        if (str_contains($ua, 'KontrolApp') || (str_contains($ua, 'Mobile/') && ! str_contains($ua, 'Safari/'))) {
            return true;
        }

        // 3. Android WebView indicators
        if (str_contains($ua, '; wv)') || str_contains($ua, 'Version/4.0')) {
            return true;
        }

        return false;
    }

    protected function detectInstalledPwa(Request $request): bool
    {
        // Detected via Inertia/AJAX headers passed from standalone frontend JS or query parameter
        if ($request->header('X-PWA-Standalone') === 'true' || $request->query('source') === 'pwa') {
            return true;
        }

        // Sec-Fetch-Dest or Sec-Fetch-Mode checks if browser sets custom display-mode hints
        if ($request->header('Sec-Fetch-Dest') === 'document' && $request->header('X-Display-Mode') === 'standalone') {
            return true;
        }

        return false;
    }

    protected function detectOperatingSystem(string $ua): string
    {
        $uaLower = strtolower($ua);

        if (str_contains($uaLower, 'iphone') || str_contains($uaLower, 'ipad') || str_contains($uaLower, 'ipod')) {
            return 'ios';
        }

        if (str_contains($uaLower, 'android')) {
            return 'android';
        }

        if (str_contains($uaLower, 'macintosh') || str_contains($uaLower, 'mac os x')) {
            return 'mac';
        }

        if (str_contains($uaLower, 'windows')) {
            return 'windows';
        }

        if (str_contains($uaLower, 'linux')) {
            return 'linux';
        }

        return 'other';
    }

    protected function detectBrowserName(string $ua): string
    {
        $uaLower = strtolower($ua);

        if (str_contains($uaLower, 'samsungbrowser')) {
            return 'samsung';
        }

        if (str_contains($uaLower, 'edg/') || str_contains($uaLower, 'edge')) {
            return 'edge';
        }

        if (str_contains($uaLower, 'firefox') || str_contains($uaLower, 'fxios')) {
            return 'firefox';
        }

        if (str_contains($uaLower, 'chrome') || str_contains($uaLower, 'crios')) {
            return 'chrome';
        }

        if (str_contains($uaLower, 'safari') && ! str_contains($uaLower, 'chrome')) {
            return 'safari';
        }

        return 'other';
    }

    protected function detectDeviceType(string $ua): string
    {
        $uaLower = strtolower($ua);

        if (str_contains($uaLower, 'ipad') || (str_contains($uaLower, 'android') && ! str_contains($uaLower, 'mobile'))) {
            return 'tablet';
        }

        if (str_contains($uaLower, 'mobile') || str_contains($uaLower, 'iphone') || str_contains($uaLower, 'ipod') || str_contains($uaLower, 'android')) {
            return 'mobile';
        }

        return 'desktop';
    }
}
