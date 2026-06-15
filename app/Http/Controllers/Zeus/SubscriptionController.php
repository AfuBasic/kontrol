<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Services\Zeus\SubscriptionIntelligenceService;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function __construct(private SubscriptionIntelligenceService $intelligenceService) {}

    public function index()
    {
        return Inertia::render('Zeus/Subscriptions/Index', [
            'kpis' => $this->intelligenceService->getKpis(),
            'planAnalytics' => $this->intelligenceService->getPlanAnalytics(),
            'renewalCohorts' => $this->intelligenceService->getRenewalCohort(),
            'migrationMatrix' => $this->intelligenceService->getUpgradeDowngradeMatrix(),
            'recentChanges' => $this->intelligenceService->getRecentPlanChanges(),
            'pastDue' => $this->intelligenceService->getPastDueSubscriptions(),
        ]);
    }
}
