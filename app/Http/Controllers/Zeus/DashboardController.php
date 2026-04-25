<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\EstateApplication;
use App\Services\Zeus\EstateService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private EstateService $estateService,
    ) {}

    public function __invoke(): Response
    {
        $applications = EstateApplication::query()
            ->with('plan:id,name')
            ->whereIn('status', ['pending', 'contacted'])
            ->orderByDesc('created_at')
            ->get(['id', 'estate_name', 'email', 'phone', 'address', 'notes', 'plan_id', 'status', 'created_at'])
            ->map(fn ($app) => [
                'id' => $app->id,
                'estate_name' => $app->estate_name,
                'email' => $app->email,
                'phone' => $app->phone,
                'address' => $app->address,
                'notes' => $app->notes,
                'status' => $app->status,
                'created_at' => $app->created_at,
                'plan' => $app->plan ? [
                    'id' => $app->plan->id,
                    'name' => $app->plan->name,
                ] : null,
            ]);

        return Inertia::render('Zeus/Dashboard', [
            'stats' => $this->estateService->getStats(),
            'applications' => $applications,
        ]);
    }
}
