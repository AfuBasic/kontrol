<?php

namespace App\Services\Admin;

use App\Models\Activity;

class ActivityService
{
    /**
     * Create a new class instance.
     */
    public function __construct(protected UserService $userService)
    {
        //
    }

    public function getCursorPaginatedActivities()
    {
        $estateId = $this->userService->getCurrentEstateId();
        
        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->where('activity_log.estate_id', $estateId)
            ->latest();

        // Infinite scroll pagination
        $activities = $query->cursorPaginate(20);

        return $activities;
    }
}
