<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Services\Resident\AccessCodeService;
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
    public function index(): Response
    {
        return Inertia::render('resident/visitors/index', [
            'activeCodes' => $this->accessCodeService->getActiveCodes()->map(fn ($code) => [
                'id' => $code->id,
                'code' => $code->code,
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'status' => $code->status->value,
                'expires_at' => $code->expires_at->toISOString(),
                'time_remaining' => $code->time_remaining,
                'created_at' => $code->created_at->toISOString(),
            ]),
            'historyCodes' => $this->accessCodeService->getCodeHistory()->map(fn ($code) => [
                'id' => $code->id,
                'code' => $code->code,
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'status' => $code->status->value,
                'expires_at' => $code->expires_at->toISOString(),
                'used_at' => $code->used_at?->toISOString(),
                'revoked_at' => $code->revoked_at?->toISOString(),
                'time_remaining' => $code->time_remaining,
                'created_at' => $code->created_at->toISOString(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new access code.
     */
    public function create(): Response
    {
        return Inertia::render('resident/visitors/create', [
            'durationOptions' => $this->accessCodeService->getDurationOptions(),
        ]);
    }

    /**
     * Store a newly created access code.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'visitor_name' => ['nullable', 'string', 'max:255'],
            'visitor_phone' => ['nullable', 'string', 'max:20'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:10080'],
        ]);

        $accessCode = $this->accessCodeService->createCode($validated);

        return redirect()->route('resident.visitors.success', $accessCode);
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

        return Inertia::render('resident/visitors/success', [
            'accessCode' => [
                'id' => $userCode->id,
                'code' => $userCode->code,
                'visitor_name' => $userCode->visitor_name,
                'visitor_phone' => $userCode->visitor_phone,
                'purpose' => $userCode->purpose,
                'status' => $userCode->status->value,
                'expires_at' => $userCode->expires_at->toISOString(),
                'time_remaining' => $userCode->time_remaining,
                'created_at' => $userCode->created_at->toISOString(),
            ],
        ]);
    }

    /**
     * Display the specified access code.
     */
    public function show(AccessCode $accessCode): Response
    {
        $userCode = $this->accessCodeService->getCode($accessCode->id);

        abort_if(! $userCode, 404);

        return Inertia::render('resident/visitors/show', [
            'accessCode' => [
                'id' => $userCode->id,
                'code' => $userCode->code,
                'visitor_name' => $userCode->visitor_name,
                'visitor_phone' => $userCode->visitor_phone,
                'purpose' => $userCode->purpose,
                'status' => $userCode->status->value,
                'expires_at' => $userCode->expires_at->toISOString(),
                'time_remaining' => $userCode->time_remaining,
                'created_at' => $userCode->created_at->toISOString(),
                'used_at' => $userCode->used_at?->toISOString(),
                'revoked_at' => $userCode->revoked_at?->toISOString(),
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
}
