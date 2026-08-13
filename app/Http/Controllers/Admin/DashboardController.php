<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\DashboardService;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService,
        protected EstateContextService $estateContext,
    ) {}

    public function __invoke(): Response
    {
        $estate = $this->estateContext->getEstate();

        return Inertia::render('Admin/Dashboard', [
            // Eager - lightweight shell for instant paint
            'estateShell' => [
                'name' => $estate->name,
                'address' => $estate->address,
            ],
            'stats' => $this->safe(fn () => $this->dashboardService->getOverviewStats()),

            // Deferred - heavy sections load independently after first paint
            'estateHealth' => Inertia::defer(fn () => $this->safe(
                fn () => $this->dashboardService->getDetailedDashboardStats()['estateHealth']
            )),
            'operationalSnapshot' => Inertia::defer(fn () => $this->safe(
                fn () => $this->dashboardService->getDetailedDashboardStats()['operationalSnapshot']
            )),
            'needsAttention' => Inertia::defer(fn () => $this->safe(
                fn () => $this->dashboardService->getDetailedDashboardStats()['needsAttention'] ?? []
            ) ?? []),
            'financialOverview' => Inertia::defer(fn () => $this->safe(
                fn () => $this->dashboardService->getDetailedDashboardStats()['financialOverview']
            )),
            'securityOperations' => Inertia::defer(fn () => $this->safe(
                fn () => $this->dashboardService->getDetailedDashboardStats()['securityOperations']
            )),
            'recentActivity' => Inertia::defer(fn () => $this->safe(
                fn () => $this->dashboardService->getRecentActivity(10)
            ) ?? collect()),
            'recentPosts' => Inertia::defer(fn () => $this->safe(
                fn () => $this->dashboardService->getRecentPosts(3)
            ) ?? collect()),
        ]);
    }

    /**
     * Gracefully degrade dashboard sections instead of 500ing the page.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T|null
     */
    private function safe(callable $callback): mixed
    {
        try {
            return $callback();
        } catch (Throwable $e) {
            report($e);

            return null;
        }
    }
}
