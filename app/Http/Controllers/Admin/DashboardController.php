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
        $detailedStats = $this->dashboardService->getDetailedDashboardStats();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $this->dashboardService->getOverviewStats(), // Keep fallback compatibility
            'detailedStats' => $detailedStats,
            'recentActivity' => $this->dashboardService->getRecentActivity(10),
            'recentPosts' => $this->dashboardService->getRecentPosts(3),
        ]);
    }
}
