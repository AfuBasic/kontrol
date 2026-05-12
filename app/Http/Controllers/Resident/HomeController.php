<?php

namespace App\Http\Controllers\Resident;

use App\Enums\EstateBoardPostAudience;
use App\Http\Controllers\Controller;
use App\Services\Admin\EstateBoardService;
use App\Services\EstateContextService;
use App\Services\Resident\AccessCodeService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
        protected EstateContextService $estateContext,
    ) {}

    public function __invoke(): Response
    {
        $estate = $this->estateContext->getEstate();
        $boardService = app(EstateBoardService::class);
        $announcements = $boardService->getFeed($estate->id, 3, [
            EstateBoardPostAudience::All,
            EstateBoardPostAudience::Residents,
        ]);

        return Inertia::render('Resident/Home', [
            'stats' => $this->accessCodeService->getHomeStats(),
            'activeCodes' => $this->accessCodeService->getActiveCodes()->map(fn ($code) => [
                'id' => $code->id,
                'code' => $code->code,
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'status' => $code->status->value,
                'source' => $code->source->value,
                'expires_at' => $code->expires_at?->toISOString(),
                'time_remaining' => $code->time_remaining,
                'created_at' => $code->created_at?->toISOString(),
            ]),
            'recentActivity' => $this->accessCodeService->getRecentActivity(5),
            'latestAnnouncements' => $announcements->items(),
            'estateName' => $estate->name,
        ]);
    }
}
