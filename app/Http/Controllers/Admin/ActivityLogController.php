<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ActivityService;
use App\Services\Admin\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function __construct(
        protected ActivityService $activityService
    ) {}

    public function index(Request $request): Response
    {
        $activities = $this->activityService->getCursorPaginatedActivities();

        return Inertia::render('admin/activity-log/Index', [
            'activities' => $activities,
        ]);
    }
}
