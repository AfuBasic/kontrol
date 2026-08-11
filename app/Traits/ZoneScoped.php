<?php

namespace App\Traits;

use App\Models\Scopes\ZoneScope;

trait ZoneScoped
{
    /**
     * Boot the ZoneScoped trait for a model.
     */
    protected static function bootZoneScoped(): void
    {
        static::addGlobalScope(new ZoneScope);
    }

    /**
     * An explicit, intentional bypass of the zone isolation scope.
     * This should ONLY be used in administrative/system-level processes, NEVER in standard controllers.
     */
    public static function withoutZoneIsolation()
    {
        return static::withoutGlobalScope(ZoneScope::class);
    }
}
