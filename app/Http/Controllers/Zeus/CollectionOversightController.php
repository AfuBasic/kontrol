<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Services\Zeus\CollectionIntelligenceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CollectionOversightController extends Controller
{
    public function __construct(private CollectionIntelligenceService $intelligenceService) {}

    public function index(Request $request): Response
    {
        $metrics = $this->intelligenceService->getGlobalMetrics();
        $collections = $this->intelligenceService->getGlobalCollections($request->all());
        $topEstates = $this->intelligenceService->getTopEstatesByRevenue();
        $defaulters = $this->intelligenceService->getGlobalDefaulters();

        return Inertia::render('Zeus/Collections/Index', [
            'metrics' => $metrics,
            'collections' => $collections,
            'topEstates' => $topEstates,
            'defaulters' => $defaulters,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Collection $collection): Response
    {
        $collection->load(['estate:id,name', 'creator:id,name,email', 'targets.target']);
        $collection->loadCount(['assignments', 'assignments as paid_assignments_count' => function ($query) {
            $query->whereColumn('amount_paid', '>=', 'amount_due');
        }]);

        $assignments = $collection->assignments()
            ->with(['user:id,name,email'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Zeus/Collections/Show', [
            'collection' => $collection,
            'assignments' => $assignments,
        ]);
    }
}
