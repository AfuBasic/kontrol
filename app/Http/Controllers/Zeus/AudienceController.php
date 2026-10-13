<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\AudienceRequest;
use App\Services\Zeus\AudienceService;
use Inertia\Inertia;
use Inertia\Response;

class AudienceController extends Controller
{
    public function __construct(private AudienceService $audience) {}

    public function index(AudienceRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('Zeus/Audience/Index', [
            'filters' => $filters,
            // Closures, so the live refresh can ask for just the figures. The estate list is only read on its own tab.
            'overview' => fn () => $this->audience->overview($filters['range']),
            'estates' => $filters['tab'] === 'estates' ? fn () => $this->audience->estates($filters, $filters['per_page']) : null,
        ]);
    }
}
