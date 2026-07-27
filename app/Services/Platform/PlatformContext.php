<?php

namespace App\Services\Platform;

class PlatformContext
{
    public function __construct(
        public readonly bool $isNativeApp,
        public readonly bool $isInstalledPwa,
        public readonly bool $isMobileBrowser,
        public readonly bool $isDesktopBrowser,
        public readonly string $operatingSystem, // 'ios', 'android', 'other'
        public readonly string $browserName,     // 'chrome', 'samsung', 'edge', 'firefox', 'safari', 'other'
        public readonly string $deviceType       // 'desktop', 'tablet', 'mobile'
    ) {}

    public function isMobileOrTablet(): bool
    {
        return in_array($this->deviceType, ['mobile', 'tablet'], true);
    }
}
