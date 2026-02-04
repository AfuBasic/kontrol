<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Services\Resident\AccessCodeService;
use Inertia\Inertia;
use Inertia\Response;

use App\Services\EstateContextService;

class HomeController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
        protected EstateContextService $estateContext,
    ) {}

    public function __invoke(): Response
    {
        $estate = $this->estateContext->getEstate();

        return Inertia::render('resident/home', [
            'stats' => $this->accessCodeService->getHomeStats(),
            'activeCodes' => $this->accessCodeService->getActiveCodes()->map(fn ($code) => [
                'id' => $code->id,
                'code' => $code->code,
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'status' => $code->status->value,
                'expires_at' => $code->expires_at?->toISOString(),
                'time_remaining' => $code->time_remaining,
                'created_at' => $code->created_at?->toISOString(),
            ]),
            'recentActivity' => $this->accessCodeService->getRecentActivity(5),
            'estateName' => $estate->name,
        ]);
    }
}
