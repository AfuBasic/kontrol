<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\AccessLog;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $user = auth()->user();
        $estate = app(\App\Services\EstateContextService::class)->getEstate();

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
            'gateName' => 'Main Entrance',
            'guardName' => $user->name,
            'stats' => [
                'expected_today' => $expectedTodayCount,
                'validated_today' => $validatedTodayCount,
                'active_codes' => $activeCodesCount,
            ],
            'recentActivity' => $recentActivity,
        ]);
    }
}
