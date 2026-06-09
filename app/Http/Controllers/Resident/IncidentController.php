<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Incidents\CreateIncidentAction;
use App\Enums\IncidentCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incidents\StoreIncidentRequest;
use App\Models\Incident;
use App\Services\EstateContextService;
use App\Services\IncidentService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    public function __construct(
        protected IncidentService $incidentService,
        protected EstateContextService $estateContext,
        protected CreateIncidentAction $createIncidentAction
    ) {}

    /**
     * Display the incident feed.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Incident::class);

        $estateId = $this->estateContext->getEstateId();
        $filters = request()->only(['category', 'status', 'tab', 'search', 'sort']);
        $incidents = $this->incidentService->getFeed($estateId, $filters);

        $categories = collect(IncidentCategory::cases())->map(fn ($cat) => [
            'value' => $cat->value,
            'label' => $cat->label(),
        ])->toArray();

        return Inertia::render('Resident/Incidents/Index', [
            'incidents' => $incidents,
            'filters' => $filters,
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new incident.
     */
    public function create(): Response
    {
        $estate = $this->estateContext->getEstate();
        $this->authorize('create', [Incident::class, $estate]);

        $categories = collect(IncidentCategory::cases())->map(fn ($cat) => [
            'value' => $cat->value,
            'label' => $cat->label(),
        ])->toArray();

        return Inertia::render('Resident/Incidents/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created incident in storage.
     */
    public function store(StoreIncidentRequest $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $this->authorize('create', [Incident::class, $estate]);

        $incident = $this->createIncidentAction->execute($request->validated(), $estate);

        return redirect()->route('resident.incidents.show', $incident->hashid)
            ->with('success', 'Incident reported successfully.');
    }

    /**
     * Display the specified incident.
     */
    public function show(Incident $incident): Response
    {
        $this->authorize('view', $incident);

        $estateId = $this->estateContext->getEstateId();
        $loadedIncident = $this->incidentService->getIncident($incident->id, $estateId);
        $comments = $this->incidentService->getComments($incident->id);

        $user = auth()->user();
        $canClose = $loadedIncident->reporter_id === $user->id && $loadedIncident->status->value === 'solved';

        return Inertia::render('Resident/Incidents/Show', [
            'incident' => $loadedIncident,
            'comments' => $comments,
            'canClose' => $canClose,
        ]);
    }
}
