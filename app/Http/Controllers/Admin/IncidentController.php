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

use App\Actions\Incidents\CreateIncidentAction;

class IncidentController extends Controller
{
    public function __construct(
        protected IncidentService $incidentService,
        protected EstateContextService $estateContext,
        protected CreateIncidentAction $createIncidentAction
    ) {}

    /**
     * Display a listing of incidents for administration.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Incident::class);

        $estateId = $this->estateContext->getEstateId();
        $filters = request()->only(['category', 'status', 'tab', 'search', 'sort', 'view', 'priority', 'assignee_id', 'reporter_id', 'sla_status']);
        $incidents = $this->incidentService->getFeed($estateId, $filters);

        $categories = collect(IncidentCategory::cases())->map(fn ($cat) => [
            'value' => $cat->value,
            'label' => $cat->label(),
        ])->toArray();

        $statuses = collect(IncidentStatus::cases())->map(fn ($stat) => [
            'value' => $stat->value,
            'label' => $stat->label(),
        ])->toArray();

        // 1. Calculate operational health stats
        $openIncidents = Incident::query()->forEstate($estateId)->where('status', IncidentStatus::Pending)->count();
        $inProgress = Incident::query()->forEstate($estateId)->where('status', IncidentStatus::Resolving)->count();
        $waitingReview = Incident::query()->forEstate($estateId)->where('status', IncidentStatus::Solved)->count();
        $resolvedThisMonth = Incident::query()->forEstate($estateId)
            ->whereIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
            ->where('updated_at', '>=', now()->startOfMonth())
            ->count();

        $resolved = Incident::query()->forEstate($estateId)
            ->whereIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
            ->whereNotNull('solved_at')
            ->get();

        $avgTime = $resolved->count() > 0 ? (int) round($resolved->avg(fn ($i) => $i->created_at->diffInHours($i->solved_at))) : 0;
        $withinSla = $resolved->filter(fn ($i) => $i->created_at->diffInHours($i->solved_at) <= 24)->count();
        $slaCompliance = $resolved->count() > 0 ? (int) round(($withinSla / $resolved->count()) * 100) : 100;

        // 2. Generate operational insights
        $unassignedCount = Incident::query()->forEstate($estateId)
            ->whereIn('status', [IncidentStatus::Pending, IncidentStatus::Acknowledged, IncidentStatus::Resolving])
            ->whereNull('assigned_to')
            ->count();

        $exceededSlaCount = Incident::query()->forEstate($estateId)
            ->whereNotIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
            ->where('created_at', '<', now()->subHours(24))
            ->count();

        $securityIncidentsThisMonth = Incident::query()->forEstate($estateId)
            ->where('category', IncidentCategory::Security)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $insights = [];
        if ($exceededSlaCount > 0) {
            $insights[] = "{$exceededSlaCount} incident(s) have exceeded the SLA target.";
        }
        if ($unassignedCount > 0) {
            $insights[] = "{$unassignedCount} reported issue(s) are currently unassigned.";
        }
        if ($securityIncidentsThisMonth > 0) {
            $insights[] = "{$securityIncidentsThisMonth} security concern(s) logged this month.";
        }
        if ($avgTime > 0) {
            $insights[] = "Average resolution time is currently at {$avgTime} hours.";
        }

        // 3. Incident Source breakdown analytics
        $totalIncidents = Incident::query()->forEstate($estateId)->count();
        $sourceBreakdown = [];
        if ($totalIncidents > 0) {
            $sources = Incident::query()->forEstate($estateId)
                ->select('source', DB::raw('count(*) as count'))
                ->groupBy('source')
                ->get();
                
            foreach ($sources as $s) {
                $sourceLabel = $s->source instanceof \App\Enums\IncidentSource 
                    ? $s->source->label() 
                    : (is_string($s->source) ? ucwords(str_replace('_', ' ', $s->source)) : 'Unknown');
                
                $sourceBreakdown[] = [
                    'source' => $s->source instanceof \App\Enums\IncidentSource ? $s->source->value : $s->source,
                    'label' => $sourceLabel,
                    'count' => $s->count,
                    'percentage' => (int) round(($s->count / $totalIncidents) * 100),
                ];
            }
        }

        // 4. Fetch active admins for assignments
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

        // 5. Fetch recent activity timeline
        $recentActivity = \Spatie\Activitylog\Models\Activity::query()
            ->where(function ($query) use ($estateId) {
                $query->where('properties->estate_id', $estateId)
                    ->orWhereHasMorph('subject', [\App\Models\Incident::class], function ($sq) use ($estateId) {
                        $sq->where('estate_id', $estateId);
                    });
            })
            ->where(function ($q) {
                $q->where('subject_type', \App\Models\Incident::class)
                    ->orWhere('description', 'like', '%incident%');
            })
            ->with('causer:id,ulid,name,email')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($act) => [
                'id' => $act->id,
                'description' => $act->description,
                'causer_name' => $act->causer?->name ?? 'System',
                'created_at' => $act->created_at->diffForHumans(),
            ])
            ->toArray();

        return Inertia::render('Admin/Incidents/Index', [
            'incidents' => $incidents,
            'filters' => $filters,
            'categories' => $categories,
            'statuses' => $statuses,
            'stats' => [
                'open' => $openIncidents,
                'in_progress' => $inProgress,
                'waiting_review' => $waitingReview,
                'resolved_this_month' => $resolvedThisMonth,
                'avg_resolution_time' => $avgTime,
                'sla_compliance' => $slaCompliance,
                'source_breakdown' => $sourceBreakdown,
            ],
            'insights' => $insights,
            'admins' => $admins,
            'recentActivity' => $recentActivity,
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

        $admins = User::forEstate($estate->id)
            ->active()
            ->get()
            ->filter(function ($u) use ($estate) {
                setPermissionsTeamId($estate->id);
                return $u->hasRole('admin');
            })
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])
            ->values()
            ->toArray();

        return Inertia::render('Admin/Incidents/Create', [
            'categories' => $categories,
            'admins' => $admins,
        ]);
    }

    /**
     * Store a newly created incident.
     */
    public function store(\App\Http\Requests\Incidents\StoreIncidentRequest $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $this->authorize('create', [Incident::class, $estate]);

        $incident = $this->createIncidentAction->execute($request->validated(), $estate);

        return redirect()->route('admin.incidents.show', $incident->hashid)
            ->with('success', 'Incident reported successfully.');
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
