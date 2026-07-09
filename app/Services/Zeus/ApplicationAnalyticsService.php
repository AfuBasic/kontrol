<?php

namespace App\Services\Zeus;

use App\Models\EstateApplication;
use Illuminate\Support\Facades\Cache;

class ApplicationAnalyticsService
{
    /**
     * Get the aggregated metrics for the Applications pipeline.
     */
    public function getPipelineMetrics(): array
    {
        return Cache::remember('zeus.applications.metrics', now()->addMinutes(10), function () {
            $totalThisMonth = EstateApplication::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            $totalAllTime = EstateApplication::count();

            $approved = EstateApplication::where('status', 'approved')->count();
            $approvalRate = $totalAllTime > 0 ? round(($approved / $totalAllTime) * 100) : 0;

            // Since we collapsed 'converted' into 'approved', we can either remove conversion rate or base it on something else.
            // But since the dashboard asks for conversion rate, let's keep it 0 for now or calculate based on active subscriptions.
            $conversionRate = 0;

            return [
                'total_this_month' => $totalThisMonth,
                'approval_rate' => $approvalRate,
                'conversion_rate' => $conversionRate,
            ];
        });
    }

    /**
     * Get the funnel distribution of all applications.
     */
    public function getFunnelData(): array
    {
        return Cache::remember('zeus.applications.funnel', now()->addMinutes(10), function () {
            $received = EstateApplication::count();
            $reviewed = EstateApplication::whereNotIn('status', ['received'])->count();
            $approved = EstateApplication::where('status', 'approved')->count();

            return [
                ['stage' => 'Received', 'count' => $received],
                ['stage' => 'Reviewed', 'count' => $reviewed],
                ['stage' => 'Approved', 'count' => $approved],
            ];
        });
    }

    /**
     * Get grouped applications for the Kanban board.
     */
    public function getGroupedApplications(): array
    {
        // Pipeline grouped by columns for the Kanban board
        $applications = EstateApplication::with(['assignedTo:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return [
            'Received' => $applications->where('status', 'received')->values(),
            'Under Review' => $applications->where('status', 'under_review')->values(),
            'Approved' => $applications->where('status', 'approved')->values(),
            'Rejected' => $applications->where('status', 'rejected')->values(),
        ];
    }
}
