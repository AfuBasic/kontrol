<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Services\Zeus\RevenueAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RevenueController extends Controller
{
    public function __construct(private RevenueAnalyticsService $revenueAnalyticsService) {}

    public function __invoke(Request $request): Response
    {
        return Inertia::render('Zeus/Revenue/Index', [
            'financialKPIs' => $this->revenueAnalyticsService->getFinancialKPIs(),
            'forecastData' => $this->revenueAnalyticsService->getRevenueForecastData(),
            'revenueBreakdown' => $this->revenueAnalyticsService->getRevenueBreakdown(),
            'topPerformers' => $this->revenueAnalyticsService->getTopPerformers(),
            'highValueTransactions' => $this->revenueAnalyticsService->getRecentHighValueTransactions(6),
            'failedPayments' => $this->revenueAnalyticsService->getRecentFailedPayments(6),
        ]);
    }
}
