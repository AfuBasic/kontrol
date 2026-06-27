<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Services\Resident\AccessCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccessCodeController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
    ) {}

    /**
     * Display a listing of access codes.
     */
    public function index(Request $request): Response
    {
        $searchActive = $request->input('search_active');
        $searchHistory = $request->input('search_history');

        $activeCodes = $this->accessCodeService->getActiveCodes($searchActive)->loadCount('accessLogs');
        $historyCodes = $this->accessCodeService->getCodeHistory(20, $searchHistory)->loadCount('accessLogs');

        return Inertia::render('Resident/Visitors/Index', [
            'filters' => [
                'search_active' => $searchActive,
                'search_history' => $searchHistory,
            ],
            'activeCodes' => $activeCodes->map(fn ($code) => [
                'id' => $code->id,
                'type' => $code->type,
                'code' => $code->code,
                'pass_uuid' => $code->pass_uuid,
                'qr_token' => $code->qr_token,
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'status' => $code->status->value,
                'source' => $code->source->value,
                'expires_at' => $code->expires_at?->toISOString(),
                'starts_at' => $code->starts_at?->toISOString(),
                'guest_limit' => $code->guest_limit,
                'uses_count' => $code->access_logs_count ?? 0,
                'used_at' => $code->used_at?->toISOString(),
                'time_remaining' => $code->time_remaining,
                'created_at' => $code->created_at->toISOString(),
            ]),
            'historyCodes' => $historyCodes->map(fn ($code) => [
                'id' => $code->id,
                'type' => $code->type,
                'code' => $code->code,
                'pass_uuid' => $code->pass_uuid,
                'qr_token' => $code->qr_token,
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'status' => $code->status->value,
                'source' => $code->source->value,
                'expires_at' => $code->expires_at?->toISOString(),
                'starts_at' => $code->starts_at?->toISOString(),
                'guest_limit' => $code->guest_limit,
                'uses_count' => $code->access_logs_count ?? 0,
                'used_at' => $code->used_at?->toISOString(),
                'revoked_at' => $code->revoked_at?->toISOString(),
                'time_remaining' => $code->time_remaining,
                'created_at' => $code->created_at->toISOString(),
            ]),
            'recentActivity' => $this->accessCodeService->getRecentActivity(5),
            'dailyUsage' => $this->accessCodeService->getDailyUsageAndLimit(),
            'visitorStats' => $this->accessCodeService->getHomeStats(),
        ]);
    }

    /**
     * Show the form for creating a new access code.
     */
    public function create(): Response
    {
        return Inertia::render('Resident/Visitors/Create', [
            'durationOptions' => $this->accessCodeService->getDurationOptions(),
            'durationConstraints' => $this->accessCodeService->getDurationConstraints(),
        ]);
    }

    /**
     * Store a newly created access code.
     */
    public function store(Request $request): RedirectResponse
    {
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
            'guest_limit' => ['nullable', 'integer', 'min:1'],
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
                'status' => $userCode->status->value,
                'source' => $userCode->source->value,
                'expires_at' => $userCode->expires_at?->toISOString(),
                'starts_at' => $userCode->starts_at?->toISOString(),
                'guest_limit' => $userCode->guest_limit,
                'time_remaining' => $userCode->time_remaining,
                'created_at' => $userCode->created_at->toISOString(),
                'used_at' => $userCode->used_at?->toISOString(),
                'revoked_at' => $userCode->revoked_at?->toISOString(),
                'estate_name' => $userCode->estate->name,
                'host_name' => $userCode->user->name,
                'notes' => $userCode->notes,
                'uses_count' => $userCode->accessLogs()->count(),
            ],
            'usageLogs' => [
                'data' => collect($usageLogs->items())->map(fn ($log) => [
                    'id' => $log->id,
                    'verified_at' => $log->verified_at->toISOString(),
                    'verifier_name' => $log->verifier?->name ?? 'Unknown',
                    'checked_out_at' => $log->checked_out_at?->toISOString(),
                    'checkout_verifier_name' => $log->checkoutVerifier?->name ?? 'Unknown',
                ]),
                'next_cursor' => $usageLogs->nextCursor()?->encode(),
                'next_page_url' => $usageLogs->nextPageUrl(),
                'per_page' => $usageLogs->perPage(),
            ],
            'filters' => [
                'date' => $dateFilter,
            ],
        ]);
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
