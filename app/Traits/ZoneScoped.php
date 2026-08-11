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
}
