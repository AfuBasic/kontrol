<?php

namespace App\Listeners;

use App\Models\Estate;
use App\Models\EstateSettings;
use App\Services\Resident\SubscriptionSyncService;
use Illuminate\Auth\Events\Login;

class WarmEstateSettings
{
    public function __construct(
        protected SubscriptionSyncService $syncService
    ) {}

    /**
     * Ensure estate settings exist and are cached on login.
     * Also syncs resident subscriptions to prevent feature leakage or access issues.
     */
    public function handle(Login $event): void
    {
        $user = $event->user;
        $estates = $user->estates()->with('settings')->get();

        foreach ($estates as $estate) {
            // Warm cache
            EstateSettings::forEstate($estate->id);

            // Sync subscription
            $this->syncService->sync($user, $estate);
        }
    }
}
