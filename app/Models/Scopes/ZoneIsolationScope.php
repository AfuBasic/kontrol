<?php

namespace App\Models\Scopes;

use App\Auth\ContextManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ZoneIsolationScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(ContextManager::class)->current();

        if (! $context) {
            // Fail closed: No valid context = no records for protected models
            $builder->whereRaw('1 = 0');

            return;
        }

        // Always enforce the estate boundary first
        $builder->where($model->getTable().'.estate_id', $context->estateId);

        // If the context is specifically zone-scoped, enforce the zone boundary
        if ($context->zoneId !== null) {
            $builder->where($model->getTable().'.zone_id', $context->zoneId);
        }
    }
}
