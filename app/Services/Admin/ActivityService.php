<?php

namespace App\Services\Admin;

use App\Models\Activity;
use App\Services\EstateContextService;

class ActivityService
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    public function getCursorPaginatedActivities()
    {
        $estateId = $this->estateContext->getEstateId();
        
        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->where('activity_log.estate_id', $estateId)
            ->latest();

        // Infinite scroll pagination
        $activities = $query->cursorPaginate(20);

        return $activities;
    }
}
