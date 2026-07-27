<?php

namespace App\Services\Platform;

use App\Models\User;
use Illuminate\Http\Request;

class AndroidMigrationService
{
    public function __construct(
        protected PlatformDetectionService $detectionService
    ) {}

    /**
     * Check if user should be shown optional native Android app migration prompt.
     */
    public function getMigrationData(Request $request, User $user): ?array
    {
        $isNativeAvailable = config('platform.android_native_available', false);
        if (! $isNativeAvailable) {
            return null;
        }

        $context = $this->detectionService->detect($request);

        // Only prompt operational Android PWA users
        if ($context->operatingSystem === 'android' && $context->isInstalledPwa) {
            $isDismissed = $request->session()->get('android_migration_prompt_dismissed', false);
            if ($isDismissed) {
                return null;
            }

            return [
                'should_prompt' => true,
                'title' => 'Native Kontrol Android App Available',
                'message' => 'The native Kontrol Android application is now available on Google Play with enhanced performance and features.',
                'play_store_url' => config('platform.play_store_url'),
            ];
        }

        return null;
    }
}
