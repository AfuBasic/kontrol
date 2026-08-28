<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Services\Zeus\PlatformAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private PlatformAnalyticsService $platformAnalyticsService,
    ) {}

    public function __invoke(Request $request): Response
    {
        // Default to Last 6 Months
        $startDate = $request->query('start_date', now()->subMonths(6)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        return Inertia::render('Zeus/Dashboard', [
            'briefing' => $this->platformAnalyticsService->getFounderBriefing(),
            'snapshot' => $this->platformAnalyticsService->getPlatformSnapshot(),
            'operationsQueue' => $this->platformAnalyticsService->getOperationsQueue(),
            'financialPulse' => $this->platformAnalyticsService->getFinancialPulse(),
            'partnerMetrics' => $this->platformAnalyticsService->getPartnerMetrics(),
            'growthChart' => $this->platformAnalyticsService->getPlatformGrowthChart($startDate, $endDate),
            'liveActivityStream' => $this->platformAnalyticsService->getLiveActivityStream(),
            'systemHealth' => $this->platformAnalyticsService->getSystemHealth(),
            'topEstates' => $this->platformAnalyticsService->getTopEstates(),
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }
}
