<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Services\Zeus\MoneyFlowService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyFlowController extends Controller
{
    public function __construct(private MoneyFlowService $moneyFlowService) {}

    public function __invoke(Request $request): Response
    {
        return Inertia::render('Zeus/MoneyFlow/Index', [
            'friction' => $this->moneyFlowService->getCheckoutFriction(),
            'velocity' => $this->moneyFlowService->getDailyCashVelocity(),
            'recentFailures' => $this->moneyFlowService->getRecentFailures(),
        ]);
    }
}
