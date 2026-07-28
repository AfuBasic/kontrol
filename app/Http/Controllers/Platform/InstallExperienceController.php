<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Services\Platform\PlatformDetectionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstallExperienceController extends Controller
{
    public function __construct(
        protected PlatformDetectionService $detectionService
    ) {}

    /**
     * Dedicated Android PWA Installation Onboarding Experience.
     */
    public function androidInstall(Request $request): Response
    {
        $context = $this->detectionService->detect($request);

        return Inertia::render('Platform/AndroidInstall', [
            'browser' => $context->browserName,
            'isInstalled' => $context->isInstalledPwa || $context->isNativeApp,
            'appStoreUrl' => config('platform.app_store_url'),
            'playStoreUrl' => config('platform.play_store_url'),
        ]);
    }

    /**
     * Dedicated iOS App Store Download Experience.
     */
    public function iosDownload(Request $request): Response
    {
        $context = $this->detectionService->detect($request);

        return Inertia::render('Platform/IosDownload', [
            'appStoreUrl' => config('platform.app_store_url'),
            'isNativeApp' => $context->isNativeApp,
        ]);
    }

    /**
     * Unsupported Platform Page (Desktop Operational Users).
     */
    public function unsupported(Request $request): Response
    {
        $user = $request->user();
        $context = $this->detectionService->detect($request);

        return Inertia::render('Platform/UnsupportedPlatform', [
            'userRole' => $user?->getRoleNames()->first() ?? 'operational',
            'deviceType' => $context->deviceType,
            'operatingSystem' => $context->operatingSystem,
        ]);
    }
}
