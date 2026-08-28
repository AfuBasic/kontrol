<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\EstateSettings;
use App\Services\EstateContextService;
use App\Services\Resident\AccessCodeService;
use App\Services\Visitor\ActiveVisitService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AccessCodeController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
        protected EstateContextService $estateContext,
        protected ActiveVisitService $activeVisitService,
    ) {}

    /**
     * Display the Visitor Timeline (Upcoming + Active + History views).
     */
    public function index(Request $request): Response
    {
        $searchUpcoming = $request->input('search_upcoming');
        $searchHistory = $request->input('search_history');

        $upcomingCodes = $this->accessCodeService->getUpcomingTimeline($searchUpcoming);
        $historyCodes = $this->accessCodeService->getHistoryTimeline(50, $searchHistory);

        $residentAddress = $this->resolveResidentAddress();

        $estateId = null;
        try {
            $estateId = $this->estateContext->getEstateId();
        } catch (Throwable) {
            $estateId = auth()->user()?->estate_id;
        }

        $settings = $estateId ? EstateSettings::forEstate($estateId) : null;
        $checkoutEnabled = $estateId ? $this->activeVisitService->isCheckoutMonitoringEnabled($estateId) : false;
        $userId = (int) auth()->id();

        $activeVisits = ($checkoutEnabled && $estateId)
            ? $this->activeVisitService->getResidentActiveVisits($estateId, $userId)
            : collect();

        $activeCount = ($checkoutEnabled && $estateId)
            ? $this->activeVisitService->countResidentActiveVisits($estateId, $userId)
            : 0;

        return Inertia::render('Resident/Visitors/Index', [
            'filters' => [
                'search_upcoming' => $searchUpcoming,
                'search_history' => $searchHistory,
            ],
            'upcomingTimeline' => $upcomingCodes->map(fn ($code) => $this->serializeAccessCode($code, $residentAddress)),
            'historyTimeline' => $historyCodes->map(fn ($code) => $this->serializeAccessCode($code, $residentAddress, withCompletion: true)),
            'activeVisits' => $activeVisits,
            'activeCount' => $activeCount,
            'checkoutEnabled' => $checkoutEnabled,
            'recentVisitors' => $this->accessCodeService->getRecentUniqueVisitors(5),
            'recentActivity' => $this->accessCodeService->getRecentActivity(5),
            'dailyUsage' => $this->accessCodeService->getDailyUsageAndLimit(),
            'visitorStats' => $this->accessCodeService->getHomeStats(),
            'accessCodesEnabled' => $settings ? (bool) $settings->access_codes_enabled : true,
        ]);
    }

    /**
     * Display the Resident Visitor Calendar page.
     */
    public function calendar(Request $request): Response
    {
        return Inertia::render('Resident/Visitors/Calendar', [
            'initialFilters' => [
                'purpose' => $request->input('purpose'),
                'status' => $request->input('status'),
                'type' => $request->input('type'),
                'search' => $request->input('search'),
            ],
        ]);
    }

    /**
     * Return JSON calendar events for date range lazy-loading.
     */
    public function calendarEvents(Request $request): JsonResponse
    {
        $startDate = $request->input('start') ? Carbon::parse($request->input('start')) : now()->startOfMonth();
        $endDate = $request->input('end') ? Carbon::parse($request->input('end')) : now()->endOfMonth();

        $events = $this->accessCodeService->getCalendarEvents(
            $startDate,
            $endDate,
            userId: $request->user()->id,
            filters: $request->only(['purpose', 'status', 'type', 'search'])
        );

        return response()->json($events);
    }

    /**
     * Serialize an AccessCode into the Visitor Timeline shape.
     *
     * Exposes effective_visit_at (and derived arrival_date / arrival_time) as the
     * canonical scheduling concept, and optionally completion_at (with derived
     * completion_date / completion_time) for the History tab.
     *
     * The frontend must consume these fields exclusively and never reference raw
     * database timestamps for grouping or sorting.
     */
    private function serializeAccessCode(AccessCode $code, ?string $residentAddress, bool $withCompletion = false): array
    {
        $effectiveVisitAt = $code->effective_visit_at;

        $base = [
            'id' => $code->id,
            'type' => $code->type,
            'code' => $code->code,
            'pass_uuid' => $code->pass_uuid,
            'qr_token' => $code->qr_token,
            'visitor_name' => $code->visitor_name,
            'visitor_phone' => $code->visitor_phone,
            'purpose' => $code->purpose,
            'status' => $code->status?->value ?? (is_string($code->status) ? $code->status : 'active'),
            'source' => $code->source?->value ?? (is_string($code->source) ? $code->source : 'web'),
            'expires_at' => $code->expires_at?->toISOString(),
            'starts_at' => $code->starts_at?->toISOString(),
            'used_at' => $code->used_at?->toISOString(),
            'revoked_at' => $code->revoked_at?->toISOString(),
            'guest_limit' => $code->guest_limit,
            'uses_count' => $code->access_logs_count ?? $code->accessLogs->count(),
            'time_remaining' => $code->time_remaining,
            'notes' => $code->notes,
            'has_vehicle' => $code->has_vehicle,
            'resident_address' => $residentAddress,
            'created_at' => $code->created_at?->toISOString() ?? now()->toISOString(),

            // --- Visitor Timeline canonical fields ---
            // effective_visit_at: the single source of truth for when this visit
            // is scheduled. Derived from starts_at → expires_at → created_at.
            'effective_visit_at' => $effectiveVisitAt->toISOString(),
            'arrival_date' => $effectiveVisitAt->timezone(config('app.timezone', 'Africa/Lagos'))->toDateString(),        // "2026-07-23"
            'arrival_time' => $code->starts_at !== null
                ? $effectiveVisitAt->timezone(config('app.timezone', 'Africa/Lagos'))->format('g:i A')                   // "10:00 AM"
                : null,                                                  // null = "Anytime"
            'expires_time' => $code->expires_at !== null
                ? $code->expires_at->timezone(config('app.timezone', 'Africa/Lagos'))->format('g:i A')
                : null,
        ];

        if ($withCompletion) {
            $completionAt = $code->completion_at;

            $base['completion_at'] = $completionAt?->toISOString();
            $base['completion_date'] = $completionAt?->timezone(config('app.timezone', 'Africa/Lagos'))->toDateString();
            $base['completion_time'] = $completionAt?->timezone(config('app.timezone', 'Africa/Lagos'))->format('g:i A');
        }

        return $base;
    }

    /**
     * Show the form for creating a new access code.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $subscription = $user->residentSubscription;
        $isSubscriptionActive = $subscription ? $subscription->isActive() : false;

        $estateId = null;
        try {
            $estateId = $this->estateContext->getEstateId();
        } catch (Throwable) {
            $estateId = $user?->estate_id;
        }

        $settings = $estateId ? EstateSettings::forEstate($estateId) : null;

        return Inertia::render('Resident/Visitors/Create', [
            'durationOptions' => $this->accessCodeService->getDurationOptions(),
            'durationConstraints' => $this->accessCodeService->getDurationConstraints(),
            'isSubscriptionActive' => $isSubscriptionActive,
            'accessCodesEnabled' => $settings ? (bool) $settings->access_codes_enabled : true,
            'requireVehicleInfo' => $settings ? (bool) $settings->require_vehicle_information : false,
        ]);
    }

    /**
     * Store a newly created access code.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $subscription = $user->residentSubscription;
        if (! $subscription || ! $subscription->isActive()) {
            return redirect()->back()->with('error', 'Active subscription required to generate access codes.');
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:single_use,long_lived,event'],
            'visitor_name' => ['nullable', 'string', 'max:255', 'required_if:type,long_lived,event'],
            'visitor_phone' => ['nullable', 'string', 'max:20'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'has_vehicle' => ['nullable', 'boolean'],
            'duration_minutes' => ['nullable', 'integer', 'required_if:type,single_use,event'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'schedule_type' => ['nullable', 'string', 'in:one_time,recurring'],
            'schedule_data' => ['nullable', 'array'],
            'guest_limit' => ['nullable', 'integer', 'min:1', 'max:10000'],
        ]);

        $accessCode = $this->accessCodeService->createCode($validated);

        return redirect()->route('resident.visitors.show', $accessCode)
            ->with('success', 'Access code generated successfully!');
    }

    /**
     * Show the success page after creating a code.
     */
    public function success(AccessCode $accessCode): Response
    {
        // Verify the code belongs to the current user
        $userCode = $this->accessCodeService->getCode($accessCode->id);

        if (! $userCode) {
            abort(404);
        }

        $userCode->load(['estate', 'user:id,name']);

        $tz = config('app.timezone', 'Africa/Lagos');
        $effectiveVisitAt = $userCode->effective_visit_at;

        return Inertia::render('Resident/Visitors/Success', [
            'accessCode' => [
                'id' => $userCode->id,
                'type' => $userCode->type,
                'code' => $userCode->code,
                'pass_uuid' => $userCode->pass_uuid,
                'qr_token' => $userCode->qr_token,
                'visitor_name' => $userCode->visitor_name,
                'visitor_phone' => $userCode->visitor_phone,
                'purpose' => $userCode->purpose,
                'status' => $userCode->status->value,
                'source' => $userCode->source->value,
                'expires_at' => $userCode->expires_at?->toISOString(),
                'starts_at' => $userCode->starts_at?->toISOString(),
                'guest_limit' => $userCode->guest_limit,
                'time_remaining' => $userCode->time_remaining,
                'created_at' => $userCode->created_at->toISOString(),
                'estate_name' => $userCode->estate->name,
                'host_name' => $userCode->user->name,
                'notes' => $userCode->notes,
                'resident_address' => $this->resolveResidentAddress(),
                'arrival_date' => $effectiveVisitAt->timezone($tz)->toDateString(),
                'arrival_time' => $userCode->starts_at !== null
                    ? $effectiveVisitAt->timezone($tz)->format('g:i A')
                    : null,
                'expires_time' => $userCode->expires_at !== null
                    ? $userCode->expires_at->timezone($tz)->format('g:i A')
                    : null,
            ],
        ]);
    }

    /**
     * Display the specified access code.
     */
    public function show(AccessCode $accessCode, Request $request): Response
    {
        $userCode = $this->accessCodeService->getCode($accessCode->id);

        abort_if(! $userCode, 404);

        $userCode->load(['estate', 'user:id,name']);

        $dateFilter = $request->input('date');
        $usageLogs = $this->accessCodeService->getUsageHistory($userCode, $dateFilter);

        $tz = config('app.timezone', 'Africa/Lagos');
        $effectiveVisitAt = $userCode->effective_visit_at;

        return Inertia::render('Resident/Visitors/Show', [
            'accessCode' => [
                'id' => $userCode->id,
                'type' => $userCode->type,
                'code' => $userCode->code,
                'pass_uuid' => $userCode->pass_uuid,
                'qr_token' => $userCode->qr_token,
                'visitor_name' => $userCode->visitor_name,
                'visitor_phone' => $userCode->visitor_phone,
                'purpose' => $userCode->purpose,
                'status' => $userCode->status?->value ?? (is_string($userCode->status) ? $userCode->status : 'active'),
                'source' => $userCode->source?->value ?? (is_string($userCode->source) ? $userCode->source : 'web'),
                'expires_at' => $userCode->expires_at?->toISOString(),
                'starts_at' => $userCode->starts_at?->toISOString(),
                'guest_limit' => $userCode->guest_limit,
                'time_remaining' => $userCode->time_remaining,
                'created_at' => $userCode->created_at?->toISOString(),
                'used_at' => $userCode->used_at?->toISOString(),
                'revoked_at' => $userCode->revoked_at?->toISOString(),
                'estate_name' => $userCode->estate?->name ?? 'My Estate',
                'host_name' => $userCode->user?->name ?? 'Resident',
                'notes' => $userCode->notes,
                'uses_count' => $userCode->accessLogs()->count(),
                'resident_address' => $this->resolveResidentAddress(),
                'arrival_date' => $effectiveVisitAt->timezone($tz)->toDateString(),
                'arrival_time' => $userCode->starts_at !== null
                    ? $effectiveVisitAt->timezone($tz)->format('g:i A')
                    : null,
                'expires_time' => $userCode->expires_at !== null
                    ? $userCode->expires_at->timezone($tz)->format('g:i A')
                    : null,
            ],
            'usageLogs' => [
                'data' => collect($usageLogs->items())->map(fn ($log) => [
                    'id' => $log->id,
                    'verified_at' => $log->verified_at->toISOString(),
                    'verifier_name' => $log->verifier?->name ?? 'Unknown',
                    'checked_out_at' => $log->checked_out_at?->toISOString(),
                    'checkout_verifier_name' => $log->checkoutVerifier?->name ?? 'Unknown',
                    'entry_point' => $log->entry_point ?? $log->meta['entry_point'] ?? $log->meta['gate'] ?? 'Main Entrance',
                    'exit_point' => $log->checked_out_at ? ($log->meta['exit_point'] ?? $log->entry_point ?? 'Main Entrance') : null,
                    'gate' => $log->entry_point ?? $log->meta['entry_point'] ?? $log->meta['gate'] ?? 'Main Entrance',
                ]),
                'next_cursor' => $usageLogs->nextCursor()?->encode(),
                'next_page_url' => $usageLogs->nextPageUrl(),
                'per_page' => $usageLogs->perPage(),
            ],
            'filters' => [
                'date' => $dateFilter,
            ],
            'durationOptions' => $this->accessCodeService->getDurationOptions(),
            'durationConstraints' => $this->accessCodeService->getDurationConstraints(),
            'allowExtendPasses' => (bool) (EstateSettings::forEstate($userCode->estate_id)->allow_residents_to_extend_visitor_passes ?? true),
        ]);
    }

    /**
     * Extend validity of the specified access code.
     */
    public function extend(AccessCode $accessCode, Request $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        if (! $settings->allow_residents_to_extend_visitor_passes) {
            return back()->withErrors(['access_code' => 'Pass extensions are currently disabled by estate policy.']);
        }

        $userCode = $this->accessCodeService->getCode($accessCode->id);

        if (! $userCode) {
            abort(404);
        }

        if ($userCode->type === 'long_lived') {
            return back()->withErrors(['access_code' => 'Long-term passes cannot be extended.']);
        }

        $validated = $request->validate([
            'duration_minutes' => ['required', 'integer', 'min:15'],
        ]);

        $this->accessCodeService->extendCode($userCode, (int) $validated['duration_minutes']);

        return back()->with('success', 'Pass extended successfully.');
    }

    /**
     * Revoke the specified access code.
     */
    public function destroy(AccessCode $accessCode): RedirectResponse
    {
        // Verify the code belongs to the current user
        $userCode = $this->accessCodeService->getCode($accessCode->id);

        if (! $userCode) {
            abort(404);
        }

        $this->accessCodeService->revokeCode($userCode);

        return back()->with('success', 'Access code revoked successfully.');
    }

    /**
     * Compose the resident's house address from their profile.
     * Returns e.g. "Plot 7, Block 8, Akinola Street" or null if not set.
     */
    private function resolveResidentAddress(): ?string
    {
        $profile = auth()->user()?->profile;

        $parts = collect([$profile?->unit_number, $profile?->address])
            ->filter()
            ->values();

        return $parts->isNotEmpty() ? $parts->implode(', ') : null;
    }

    /**
     * Track and increment visitor pass sharing.
     */
    public function share(AccessCode $accessCode): JsonResponse
    {
        $userCode = $this->accessCodeService->getCode($accessCode->id);
        abort_if(! $userCode, 404);

        $this->accessCodeService->incrementShare($userCode);

        return response()->json([
            'success' => true,
            'share_count' => $userCode->share_count,
            'last_shared_at' => $userCode->last_shared_at?->toISOString(),
        ]);
    }
}
