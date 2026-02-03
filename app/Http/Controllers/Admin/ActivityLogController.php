<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request): Response
    {
        $estateId = $this->userService->getCurrentEstateId();
        
        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->where('activity_log.estate_id', $estateId)
            ->latest();

        // Infinite scroll pagination
        $activities = $query->cursorPaginate(20);

        return Inertia::render('admin/activity-log/Index', [
            'activities' => $activities,
        ]);
    }
}
