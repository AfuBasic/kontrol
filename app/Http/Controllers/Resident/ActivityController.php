<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Services\Resident\AccessCodeService;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('resident/activity', [
            'activities' => $this->accessCodeService->getRecentActivity(50),
        ]);
    }
}
