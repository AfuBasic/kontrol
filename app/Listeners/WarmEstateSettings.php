<?php

namespace App\Listeners;

use App\Models\EstateSettings;
use Illuminate\Auth\Events\Login;

class WarmEstateSettings
{
    /**
     * Ensure estate settings exist and are cached on login.
     */
    public function handle(Login $event): void
    {
        $estateIds = $event->user->estates()->pluck('estates.id');

        foreach ($estateIds as $estateId) {
            EstateSettings::forEstate($estateId);
        }
    }
}
