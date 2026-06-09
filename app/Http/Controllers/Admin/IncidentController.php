<?php

namespace App\Http\Controllers\Admin;

use App\Enums\IncidentCategory;
use App\Enums\IncidentStatus;
use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\User;
use App\Services\EstateContextService;
use App\Services\IncidentService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    public function __construct(
        protected IncidentService $incidentService,
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of incidents for administration.
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

        $statuses = collect(IncidentStatus::cases())->map(fn ($stat) => [
            'value' => $stat->value,
            'label' => $stat->label(),
        ])->toArray();

        return Inertia::render('Admin/Incidents/Index', [
            'incidents' => $incidents,
            'filters' => $filters,
            'categories' => $categories,
            'statuses' => $statuses,
        ]);
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

        // Fetch active admins in this estate for assignments
        $admins = User::forEstate($estateId)
            ->active()
            ->get()
            ->filter(function ($u) use ($estateId) {
                setPermissionsTeamId($estateId);

                return $u->hasRole('admin');
            })
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])
            ->values()
            ->toArray();

        $statuses = collect(IncidentStatus::cases())
            ->filter(fn ($s) => $s !== IncidentStatus::Closed) // admins cannot close directly
            ->map(fn ($stat) => [
                'value' => $stat->value,
                'label' => $stat->label(),
            ])
            ->values()
            ->toArray();

        return Inertia::render('Admin/Incidents/Show', [
            'incident' => $loadedIncident,
            'comments' => $comments,
            'admins' => $admins,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Remove the specified incident from storage.
     */
    public function destroy(Incident $incident): RedirectResponse
    {
        $this->authorize('delete', $incident);

        $incident->delete();

        return redirect()->route('admin.incidents.index')
            ->with('success', 'Incident deleted successfully.');
    }
}
