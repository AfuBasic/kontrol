<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Services\Admin\ActivityService;
use App\Services\EstateContextService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function __construct(
        protected ActivityService $activityService,
        protected EstateContextService $estateContext
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString() ?: null;
        $module = $request->string('module')->toString() ?: null;

        $paginator = $this->activityService->getCursorPaginatedActivities($search, $module);
        $activities = ActivityResource::collection($paginator);

        $estateId = $this->estateContext->getEstateId();
        $todayCount = Activity::query()
            ->where('estate_id', $estateId)
            ->whereDate('created_at', today())
            ->count();

        $lastActivity = Activity::query()
            ->where('estate_id', $estateId)
            ->latest('created_at')
            ->first();

        return Inertia::render('Admin/ActivityLog/Index', [
            'activities' => $activities,
            'filters' => [
                'search' => $search,
                'module' => $module,
            ],
            'meta' => [
                'today_count' => $todayCount,
                'last_activity_at' => $lastActivity?->created_at?->diffForHumans() ?? 'None yet',
            ],
        ]);
    }
}
