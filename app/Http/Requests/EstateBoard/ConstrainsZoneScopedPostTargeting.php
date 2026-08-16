<?php

namespace App\Http\Requests\EstateBoard;

use App\Auth\ContextManager;

trait ConstrainsZoneScopedPostTargeting
{
    protected function prepareForValidation(): void
    {
        $context = app(ContextManager::class)->current();

        if ($context?->isZoneScoped()) {
            $this->merge([
                'zone_ids' => [$context->zoneId],
            ]);
        }
    }
}
