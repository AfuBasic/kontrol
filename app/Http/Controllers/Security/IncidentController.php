<?php

namespace App\Http\Controllers\Security;

use App\Actions\Incidents\CreateIncidentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incidents\StoreIncidentRequest;
use App\Models\AdministrativeAssignment;
use App\Models\EstateSettings;
use App\Models\Incident;
use App\Models\IncidentComment;
use App\Models\IncidentUpvote;
use App\Models\User;
use App\Notifications\Incidents\IncidentDeletedNotification;
use App\Services\EstateContextService;
use App\Services\IncidentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
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
     * Display the incident list for security personnel.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Incident::class);

        $estateId = $this->estateContext->getEstateId();
        $filters = request()->only(['category', 'status', 'tab', 'search', 'sort']);
        $incidents = $this->incidentService->getFeed($estateId, $filters);

        $categories = EstateSettings::resolveCategoriesForEstate($estateId);

        return Inertia::render('Security/Incidents/Index', [
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

        $categories = EstateSettings::resolveCategoriesForEstate($estate->id);

        return Inertia::render('Security/Incidents/Create', [
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

        return redirect()->route('security.incidents.show', $incident->hashid)
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
        $officialComments = $this->incidentService->getOfficialComments($incident->id);
        $discussionComments = $this->incidentService->getDiscussionComments($incident->id);

        return Inertia::render('Security/Incidents/Show', [
            'incident' => $loadedIncident,
            'official_comments' => $officialComments,
            'discussion_comments' => $discussionComments,
            'comments' => $discussionComments,
        ]);
    }

    /**
     * Remove the specified incident from storage.
     */
    public function destroy(Incident $incident): RedirectResponse
    {
        $this->authorize('delete', $incident);

        // Fetch admins of this estate to notify
        $adminIds = AdministrativeAssignment::where('estate_id', $incident->estate_id)
            ->where('is_active', true)
            ->whereHas('role', fn ($q) => $q->where('name', 'admin'))
            ->pluck('user_id')
            ->toArray();

        // Fetch upvoters of this incident
        $upvoterIds = IncidentUpvote::where('incident_id', $incident->id)
            ->pluck('user_id')
            ->toArray();

        // Fetch commenters on this incident
        $commenterIds = IncidentComment::where('incident_id', $incident->id)
            ->pluck('user_id')
            ->toArray();

        // Notify admins, upvoters, and commenters, excluding the deleter themselves (the reporter)
        $recipientIds = collect([])
            ->concat($adminIds)
            ->concat($upvoterIds)
            ->concat($commenterIds)
            ->unique()
            ->filter(fn ($id) => $id !== auth()->id())
            ->toArray();

        if (! empty($recipientIds)) {
            $recipients = User::whereIn('id', $recipientIds)->get();
            Notification::send(
                $recipients,
                new IncidentDeletedNotification(
                    $incident->title,
                    $incident->estate->name,
                    auth()->user()->name
                )
            );
        }

        $incident->delete();

        return redirect()->route('security.incidents.index')
            ->with('success', 'Incident deleted successfully.');
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
}
