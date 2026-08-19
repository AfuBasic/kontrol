<?php

namespace App\Support;

use App\Services\Platform\PlatformContext;
use App\Services\Platform\PlatformDetectionService;
use Illuminate\Http\Request;

class DeviceMetadata
{
    /**
     * @param  array{country?: string|null, city?: string|null}  $location
     */
    public function __construct(
        public readonly string $displayName,
        public readonly string $deviceType,
        public readonly string $platform,
        public readonly string $browser,
        public readonly ?string $ipAddress,
        public readonly ?string $approximateLocation,
        public readonly bool $isNativeApp,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $platform = app(PlatformDetectionService::class)->detect($request);
        $browser = self::resolveBrowser($request, $platform);
        $operatingSystem = self::humanizePlatform($platform->operatingSystem);
        $isNativeApp = $platform->isNativeApp;
        $deviceType = $isNativeApp
            ? ($platform->operatingSystem === 'ios' ? 'ios' : 'android')
            : 'web';

        $displayName = $isNativeApp
            ? 'Kontrol on '.$operatingSystem
            : $browser.' on '.$operatingSystem;

        $location = self::approximateLocation($request);

        return new self(
            displayName: $displayName,
            deviceType: $deviceType,
            platform: $platform->operatingSystem,
            browser: $isNativeApp ? 'Kontrol' : $browser,
            ipAddress: $request->ip(),
            approximateLocation: $location,
            isNativeApp: $isNativeApp,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'display_name' => $this->displayName,
            'device_type' => $this->deviceType,
            'platform' => $this->platform,
            'browser' => $this->browser,
            'approximate_location' => $this->approximateLocation,
        ];
    }

    private static function resolveBrowser(Request $request, PlatformContext $platform): string
    {
        $clientHint = $request->header('Sec-CH-UA', '');

        if ($clientHint !== '' && preg_match('/Brave/i', $clientHint)) {
            return 'Brave';
        }

        return match ($platform->browserName) {
            'chrome' => 'Chrome',
            'safari' => 'Safari',
            'firefox' => 'Firefox',
            'edge' => 'Edge',
            'samsung' => 'Samsung Internet',
            default => 'Browser',
        };
    }

    private static function humanizePlatform(string $operatingSystem): string
    {
        return match ($operatingSystem) {
            'ios' => 'iPhone',
            'android' => 'Android',
            'mac' => 'macOS',
            'windows' => 'Windows',
            'linux' => 'Linux',
            default => 'Unknown OS',
        };
    }

    private static function approximateLocation(Request $request): ?string
    {
        $countryCode = $request->header('CF-IPCountry')
            ?: $request->header('CloudFront-Viewer-Country')
            ?: $request->header('X-AppEngine-Country');

        if (! is_string($countryCode) || in_array(strtoupper($countryCode), ['', 'XX', 'T1', 'ZZ'], true)) {
            return null;
        }

        $countryCode = strtoupper($countryCode);
        $city = $request->header('CF-IPCity');
        $country = self::countryName($countryCode);

        if (is_string($city) && $city !== '') {
            return $city.', '.$country;
        }

        return $country;
    }

    private static function countryName(string $countryCode): string
    {
        if (class_exists(\Locale::class)) {
            $name = \Locale::getDisplayRegion('-'.$countryCode, 'en');

            if (is_string($name) && $name !== '' && $name !== $countryCode) {
                return $name;
            }
        }

        return $countryCode;
    }
}
