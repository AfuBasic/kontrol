<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Services\Zeus\EstateService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private EstateService $estateService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        return Inertia::render('zeus/dashboard', [
            'stats' => $this->estateService->getStats(),
            'estates' => $this->estateService->getPaginatedEstates($search ?: null, $status ?: null),
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }
}
