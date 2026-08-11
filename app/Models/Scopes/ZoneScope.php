<?php

namespace App\Models\Scopes;

use App\Auth\ContextManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ZoneScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(ContextManager::class)->current();

        if (! $context) {
            // Case C & Case D: No active context or invalid context
            // Fail closed to prevent unrestricted access.
            $builder->whereRaw('1 = 0');

            return;
        }

        $estateId = $context->estateId;
        $zoneId = $context->zoneId;

        // Ensure the estate boundary is always enforced first.
        // We assume the model has an 'estate_id' if it uses this scope,
        // or that filtering by estate is required.
        // Even if the model only has zone_id, we should secure it via its estate context where applicable.
        $builder->where($model->getTable().'.estate_id', $estateId);

        if ($zoneId !== null) {
            // Case A: Zone-scoped context
            $builder->where($model->getTable().'.zone_id', $zoneId);
        } else {
            // Case B: Estate-scoped context
            // Estate administrator can access all zones belonging to the estate.
            // Do NOT apply the zone_id filter, but the estate_id filter above remains.
        }
    }
}
