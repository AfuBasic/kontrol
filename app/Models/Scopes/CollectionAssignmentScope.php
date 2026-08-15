<?php

namespace App\Models\Scopes;

use App\Auth\ContextManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class CollectionAssignmentScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(ContextManager::class)->current();

        if (! $context) {
            $builder->whereRaw('1 = 0');

            return;
        }

        $builder->where($model->getTable().'.estate_id', $context->estateId);

        if ($context->isZoneScoped()) {
            $builder->where(function ($query) use ($context) {
                $query->whereHas('property', function ($q) use ($context) {
                    $q->where('zone_id', $context->zoneId);
                })->orWhere(function ($q) use ($context) {
                    $q->whereNull('property_id')
                        ->whereHas('user.estates', function ($sq) use ($context) {
                            $sq->where('estates.id', $context->estateId)
                                ->where('estate_users_membership.zone_id', $context->zoneId);
                        });
                });
            });
        }
    }
}
