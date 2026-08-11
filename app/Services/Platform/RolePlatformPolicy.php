<?php

namespace App\Services\Platform;

use App\Models\User;

class RolePlatformPolicy
{
    /**
     * Determine the user's role category (administrative vs operational).
     */
    public function getCategoryForUser(User $user): string
    {
        $categories = config('platform.role_categories', []);

        // Administrative check
        $adminRoles = $categories['administrative'] ?? [];
        foreach ($adminRoles as $role) {
            if ($user->contextHasRole($role)) {
                return 'administrative';
            }
        }

        // Operational check
        $operationalRoles = $categories['operational'] ?? [];
        foreach ($operationalRoles as $role) {
            if ($user->contextHasRole($role)) {
                return 'operational';
            }
        }

        // Default fallback to administrative for unmapped roles
        return 'administrative';
    }

    /**
     * Evaluate if access is permitted according to platform matrix.
     */
    public function isAllowed(User $user, PlatformContext $context): bool
    {
        $category = $this->getCategoryForUser($user);
        $policies = config("platform.platform_policy.{$category}", []);

        if ($context->isNativeApp) {
            return (bool) ($policies['native_app'] ?? true);
        }

        if ($context->isInstalledPwa) {
            return (bool) ($policies['installed_pwa'] ?? true);
        }

        if ($context->isDesktopBrowser) {
            return (bool) ($policies['desktop_browser'] ?? true);
        }

        if ($context->isMobileBrowser) {
            if ($context->operatingSystem === 'ios') {
                return (bool) ($policies['ios_browser'] ?? false);
            }

            if ($context->operatingSystem === 'android') {
                return (bool) ($policies['android_browser'] ?? true);
            }

            return (bool) ($policies['mobile_browser'] ?? true);
        }

        return true;
    }

    /**
     * Resolve the target redirect URL for denied users.
     */
    public function getRedirectDestination(User $user, PlatformContext $context): string
    {
        if ($context->operatingSystem === 'android') {
            return route('platform.install.android');
        }

        if ($context->operatingSystem === 'ios') {
            return route('platform.install.ios');
        }

        return route('platform.unsupported');
    }
}
