<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService,
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => $this->dashboardService->getOverviewStats(),
            'chartData' => $this->dashboardService->getActivityChartData(),
            'recentActivity' => $this->dashboardService->getRecentActivity(),
            'recentPosts' => $this->dashboardService->getRecentPosts(),
            'todayStats' => $this->dashboardService->getTodayStats(),
        ]);
    }
}
