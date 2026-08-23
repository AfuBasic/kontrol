<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Incidents\CreateIncidentAction;
use App\Auth\ContextManager;
use App\Enums\IncidentCategory;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incidents\StoreIncidentRequest;
use App\Models\AdministrativeAssignment;
use App\Models\EstateSettings;
use App\Models\Incident;
use App\Models\User;
use App\Models\Zone;
use App\Services\EstateContextService;
use App\Services\IncidentService;
use App\Services\ZoneAudienceResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class IncidentController extends Controller
{
    public function __construct(
        protected IncidentService $incidentService,
        protected EstateContextService $estateContext,
        protected CreateIncidentAction $createIncidentAction,
        protected ZoneAudienceResolver $zoneAudience,
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

        $categories = EstateSettings::resolveCategoriesForEstate($estateId);

        $statuses = collect(IncidentStatus::cases())->map(fn ($stat) => [
            'value' => $stat->value,
            'label' => $stat->label(),
        ])->toArray();

        // 1. Calculate operational health stats
        $openIncidents = (clone $this->incidentQueryForActiveContext($estateId))->where('status', IncidentStatus::Pending)->count();
        $inProgress = (clone $this->incidentQueryForActiveContext($estateId))->where('status', IncidentStatus::Resolving)->count();
        $waitingReview = (clone $this->incidentQueryForActiveContext($estateId))->where('status', IncidentStatus::Solved)->count();
        $resolvedThisMonth = (clone $this->incidentQueryForActiveContext($estateId))
            ->whereIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
            ->where('updated_at', '>=', now()->startOfMonth())
            ->count();

        $resolved = (clone $this->incidentQueryForActiveContext($estateId))
            ->whereIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
            ->whereNotNull('solved_at')
            ->get();

        $avgTime = $resolved->count() > 0 ? (int) round($resolved->avg(fn ($i) => $i->created_at->diffInHours($i->solved_at))) : 0;
        $withinSla = $resolved->filter(fn ($i) => $i->created_at->diffInHours($i->solved_at) <= 24)->count();
        $slaCompliance = $resolved->count() > 0 ? (int) round(($withinSla / $resolved->count()) * 100) : 100;

        // 2. Generate operational insights
        $unassignedCount = (clone $this->incidentQueryForActiveContext($estateId))
            ->whereIn('status', [IncidentStatus::Pending, IncidentStatus::Acknowledged, IncidentStatus::Resolving])
            ->whereNull('assigned_to')
            ->count();

        $exceededSlaCount = (clone $this->incidentQueryForActiveContext($estateId))
            ->whereNotIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
            ->where('created_at', '<', now()->subHours(24))
            ->count();

        $securityIncidentsThisMonth = (clone $this->incidentQueryForActiveContext($estateId))
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
        $totalIncidents = (clone $this->incidentQueryForActiveContext($estateId))->count();
        $sourceBreakdown = [];
        if ($totalIncidents > 0) {
            $sources = (clone $this->incidentQueryForActiveContext($estateId))
                ->select('source', DB::raw('count(*) as count'))
                ->groupBy('source')
                ->get();

            foreach ($sources as $s) {
                $sourceLabel = $s->source instanceof IncidentSource
                    ? $s->source->label()
                    : (is_string($s->source) ? ucwords(str_replace('_', ' ', $s->source)) : 'Unknown');

                $sourceBreakdown[] = [
                    'source' => $s->source instanceof IncidentSource ? $s->source->value : $s->source,
                    'label' => $sourceLabel,
                    'count' => $s->count,
                    'percentage' => (int) round(($s->count / $totalIncidents) * 100),
                ];
            }
        }

        // 4. Fetch active admins for assignments
        $admins = $this->adminOptionsForActiveContext($estateId)->toArray();

        // 5. Fetch recent activity timeline
        $recentActivity = Activity::query()
            ->where(function ($query) use ($estateId) {
                $query->where('properties->estate_id', $estateId)
                    ->orWhereHasMorph('subject', [Incident::class], function ($sq) use ($estateId) {
                        $sq->where('estate_id', $estateId);
                    });
            })
            ->where(function ($q) {
                $q->where('subject_type', Incident::class)
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
            'filters' => (object) $filters,
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

        // Fetch active admins in this estate for assignments
        $admins = $this->adminOptionsForActiveContext($estateId, $incident->zone_id)->toArray();

        $statuses = collect(IncidentStatus::cases())
            ->filter(fn ($s) => $s !== IncidentStatus::Closed) // admins cannot close directly
            ->map(fn ($stat) => [
                'value' => $stat->value,
                'label' => $stat->label(),
            ])
            ->values()
            ->toArray();

        $categories = EstateSettings::resolveCategoriesForEstate($estateId);

        return Inertia::render('Admin/Incidents/Show', [
            'incident' => $loadedIncident,
            'official_comments' => $this->incidentService->getOfficialComments($incident->id),
            'discussion_comments' => Inertia::defer(fn () => $this->incidentService->getDiscussionComments($incident->id)),
            'comments' => Inertia::defer(fn () => $this->incidentService->getDiscussionComments($incident->id)),
            'admins' => $admins,
            'statuses' => $statuses,
            'categories' => $categories,
            'activities' => Inertia::defer(fn () => Activity::query()
                ->forSubject($incident)
                ->with('causer:id,name')
                ->latest()
                ->get()
                ->map(fn ($act) => [
                    'id' => $act->id,
                    'description' => $act->description,
                    'created_at' => $act->created_at->diffForHumans(),
                    'causer' => $act->causer ? ['name' => $act->causer->name] : null,
                ])
                ->toArray()),
        ]);
    }

    /**
     * Show the form for creating a new incident.
     */
    public function create(): Response
    {
        $estate = $this->estateContext->getEstate();
        $this->authorize('create', [Incident::class, $estate]);

        $categories = EstateSettings::resolveCategoriesForEstate($estate->id);

        $zones = $this->zonesForIncidentForms($estate->id);
        $admins = $this->adminOptionsForActiveContext($estate->id)->toArray();

        return Inertia::render('Admin/Incidents/Create', [
            'categories' => $categories,
            'admins' => $admins,
            'zones' => $zones,
        ]);
    }

    /**
     * Store a newly created incident.
     */
    public function store(StoreIncidentRequest $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $this->authorize('create', [Incident::class, $estate]);

        $incident = $this->createIncidentAction->execute($request->validated(), $estate);

        return redirect()->route('admin.incidents.show', $incident->hashid)
            ->with('success', 'Incident reported successfully.');
    }

    /**
     * Check if a file with the given hash has already been uploaded.
     */
    public function checkDeduplication(Request $request): JsonResponse
    {
        $request->validate([
            'hash' => ['required', 'string'],
        ]);

        $estateId = $this->estateContext->getEstateId();

        $existing = Incident::where('estate_id', $estateId)
            ->where('attachment_hash', $request->input('hash'))
            ->whereNotNull('attachment_url')
            ->first();

        if ($existing) {
            return response()->json([
                'exists' => true,
                'url' => $existing->attachment_url,
                'type' => $existing->attachment_type,
            ]);
        }

        return response()->json([
            'exists' => false,
        ]);
    }

    /**
     * Generate signed upload parameters for Cloudinary direct upload.
     */
    public function signedUploadParams(Request $request): JsonResponse
    {
        $request->validate([
            'resource_type' => ['required', 'string', 'in:image,video'],
        ]);

        $estateId = $this->estateContext->getEstateId();
        $folder = 'incidents/estate-'.$estateId;
        $timestamp = time();

        $params = [
            'folder' => $folder,
            'timestamp' => $timestamp,
        ];

        $cloudinaryUrl = env('CLOUDINARY_URL');
        $parsed = parse_url($cloudinaryUrl);
        $apiKey = $parsed['user'] ?? '';
        $apiSecret = $parsed['pass'] ?? '';
        $cloudName = $parsed['host'] ?? '';

        // Generate signature: sort, concat, append secret, SHA-1
        ksort($params);
        $signString = '';
        foreach ($params as $key => $value) {
            $signString .= "$key=$value&";
        }
        $signString = rtrim($signString, '&').$apiSecret;
        $signature = sha1($signString);

        return response()->json([
            'signature' => $signature,
            'timestamp' => $timestamp,
            'folder' => $folder,
            'api_key' => $apiKey,
            'cloud_name' => $cloudName,
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

    /**
     * Remove multiple incidents from storage.
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'string'],
        ]);

        $incidents = Incident::whereIn('hashid', $validated['ids'])->get();
        $deletedCount = 0;

        foreach ($incidents as $incident) {
            $this->authorize('delete', $incident);
            $incident->delete();
            $deletedCount++;
        }

        return redirect()->back()
            ->with('success', "{$deletedCount} incident(s) deleted successfully.");
    }

    /**
     * @return Builder<Incident>
     */
    private function incidentQueryForActiveContext(int $estateId): Builder
    {
        $query = Incident::query()->forEstate($estateId);
        $context = app(ContextManager::class)->current();

        if ($context?->isZoneScoped()) {
            $query->where(function ($zoneScope) use ($context): void {
                $zoneScope->whereNull('zone_id')
                    ->orWhere('zone_id', $context->zoneId);
            });
        }

        return $query;
    }

    /**
     * @return Collection<int, array{id: int, name: string}>
     */
    private function adminOptionsForActiveContext(int $estateId, ?int $zoneId = null): Collection
    {
        $context = app(ContextManager::class)->current();
        $targetZoneId = $context?->isZoneScoped() ? $context->zoneId : $zoneId;

        $adminIds = AdministrativeAssignment::query()
            ->where('estate_id', $estateId)
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('name', 'admin'))
            ->when($context?->isZoneScoped() || $targetZoneId !== null, function ($query) use ($targetZoneId): void {
                $query->where(function ($estateScope): void {
                    $estateScope->where('scope_type', 'estate')
                        ->whereNull('zone_id');
                });

                if ($targetZoneId !== null) {
                    $query->orWhere(function ($zoneScope) use ($targetZoneId): void {
                        $zoneScope->where('scope_type', 'zone')
                            ->where('zone_id', $targetZoneId);
                    });
                }
            })
            ->pluck('user_id')
            ->unique()
            ->values();

        return User::whereIn('id', $adminIds)
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])
            ->values();
    }

    /**
     * @return Collection<int, Zone>
     */
    private function zonesForIncidentForms(int $estateId): Collection
    {
        $zones = $this->zoneAudience->zonesForEstate($estateId);
        $context = app(ContextManager::class)->current();

        if ($context?->isZoneScoped()) {
            return $zones->where('id', $context->zoneId)->values();
        }

        return $zones;
    }
}
