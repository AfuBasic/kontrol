<?php

namespace App\Policies;

use App\Auth\ContextManager;
use Illuminate\Auth\Access\HandlesAuthorization;

abstract class BaseContextPolicy
{
    use HandlesAuthorization;

    protected function hasValidContextForEstate(int $estateId, ?int $zoneId = null): bool
    {
        $context = app(ContextManager::class)->current();
        if ($context === null || $context->estateId !== $estateId) {
            return false;
        }

        if ($context->isZoneScoped()) {
            if ($zoneId !== null && $context->zoneId !== $zoneId) {
                return false;
            }
        }

        return true;
    }
}
