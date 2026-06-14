<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Services\Zeus\PlatformAnalyticsService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private PlatformAnalyticsService $platformAnalyticsService,
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('Zeus/Dashboard', [
            'briefing' => $this->platformAnalyticsService->getFounderBriefing(),
            'metrics' => $this->platformAnalyticsService->getExecutiveMetrics(),
            'growthChart' => $this->platformAnalyticsService->getPlatformGrowthChart(),
        ]);
    }
}
