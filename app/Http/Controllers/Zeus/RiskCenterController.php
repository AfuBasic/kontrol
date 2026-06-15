<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Services\Zeus\RiskAssessmentService;
use Inertia\Inertia;
use Inertia\Response;

class RiskCenterController extends Controller
{
    public function index(RiskAssessmentService $riskAssessmentService): Response
    {
        return Inertia::render('Zeus/RiskCenter/Index', [
            'riskList' => $riskAssessmentService->getChurnRiskList(),
            'activityStream' => $riskAssessmentService->getPlatformActivityStream(50),
        ]);
    }
}
