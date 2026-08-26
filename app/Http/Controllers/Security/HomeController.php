<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Services\EstateContextService;
use App\Services\Security\CheckpointClaimService;
use App\Services\Visitor\ActiveVisitService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext,
        protected CheckpointClaimService $checkpointClaimService,
        protected ActiveVisitService $activeVisitService,
    ) {}

    public function __invoke(): Response
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();
        $gateName = $this->checkpointClaimService->getCurrentCheckpoint($estate->id, $user) ?? 'Main Entrance';

        $today = now()->startOfDay();

        $expectedTodayCount = AccessCode::query()
            ->forEstate($estate->id)
            ->active()
            ->whereDate('created_at', '>=', $today->copy()->subDay())
            ->whereDoesntHave('accessLogs', function ($q) use ($today) {
                $q->whereDate('verified_at', $today);
            })
            ->count();

        $validatedTodayCount = AccessLog::query()
            ->where('estate_id', $estate->id)
            ->whereDate('verified_at', $today)
            ->count();

        $checkoutEnabled = $this->activeVisitService->isCheckoutMonitoringEnabled($estate->id);
        $activeInsideCount = $checkoutEnabled
            ? $this->activeVisitService->countEstateActiveVisits($estate->id)
            : 0;

        $activeCodesCount = AccessCode::query()
            ->forEstate($estate->id)
            ->active()
            ->count();

        $recentActivity = AccessLog::query()
            ->where('estate_id', $estate->id)
            ->with(['accessCode:id,code,visitor_name,user_id,type', 'accessCode.user:id,name'])
            ->orderByDesc('verified_at')
            ->limit(8)
            ->get()
            ->map(fn (AccessLog $log) => [
                'id' => $log->id,
                'visitor_name' => $log->accessCode?->visitor_name ?? ($log->meta['visitor_name'] ?? 'Unknown'),
                'host_name' => $log->accessCode?->user?->name,
                'code' => $log->accessCode?->code,
                'verified_at' => $log->verified_at?->toIso8601String(),
                'verified_at_human' => $log->verified_at?->diffForHumans(['short' => true]),
                'type' => $log->accessCode?->type,
            ]);

        return Inertia::render('Security/Home', [
            'estateName' => $estate->name,
            'gateName' => $gateName,
            'guardName' => $user->name,
            'checkoutEnabled' => $checkoutEnabled,
            'stats' => [
                'expected_today' => $expectedTodayCount,
                'validated_today' => $validatedTodayCount,
                'active_codes' => $activeCodesCount,
                'active_inside' => $activeInsideCount,
            ],
            'recentActivity' => $recentActivity,
        ]);
    }
}
