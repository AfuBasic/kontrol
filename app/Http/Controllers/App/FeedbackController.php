<?php

namespace App\Http\Controllers\App;

use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\App\SubmitFeedbackRequest;
use App\Models\Feedback;
use App\Services\Zeus\ImpersonationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class FeedbackController extends Controller
{
    /**
     * Store new feedback submitted by an authenticated user.
     */
    public function store(
        SubmitFeedbackRequest $request,
        ContextManager $contextManager,
        ImpersonationService $impersonationService
    ): JsonResponse|RedirectResponse {
        $user = $request->user();
        $validated = $request->validated();

        // 1. Determine active estate context
        $activeContext = $contextManager->resolve($request);
        $estateId = $activeContext?->estateId;

        // If no administrative context is active, check resident active estate in session or user's first estate
        if (! $estateId) {
            $estateId = $request->session()->get('active_resident_estate_id')
                ?? $request->session()->get('estate_id')
                ?? $user->estates()->first()?->id;
        }

        // 2. Determine role context
        $roleContext = null;
        if ($activeContext) {
            $roleContext = 'admin';
        } elseif ($request->session()->has('active_resident_estate_id')) {
            $roleContext = 'resident';
        } elseif ($user->partner_id) {
            $roleContext = 'partner';
        } else {
            $roleContext = $user->user_type ?? 'resident';
        }

        // 3. Authoritative Support Mode check
        $isSupportMode = $impersonationService->isImpersonating($request);
        $impersonatorId = null;

        if ($isSupportMode) {
            $activeSession = $impersonationService->getActiveSession($request);
            // The provider_identifier or originating admin. If impersonated via Zeus, the session stores it.
            // If there's an administrative session, we check if provider has a user id or record the session id
            $impersonatorId = $request->session()->get('zeus_admin_id');
        }

        // 4. Determine platform if not explicitly passed from native app headers/body
        $platform = $validated['platform'] ?? null;
        if (! $platform) {
            $userAgent = strtolower((string) $request->userAgent());
            if (str_contains($userAgent, 'iphone') || str_contains($userAgent, 'ipad')) {
                $platform = 'ios';
            } elseif (str_contains($userAgent, 'android')) {
                $platform = 'android';
            } else {
                $platform = 'web';
            }
        }

        $feedback = Feedback::create([
            'user_id' => $user->id,
            'estate_id' => $estateId,
            'category' => $validated['category'],
            'message' => $validated['message'],
            'status' => 'new',
            'source' => $validated['source'] ?? 'support_page',
            'platform' => $platform,
            'app_version' => $validated['app_version'] ?? null,
            'route_or_screen' => $validated['route_or_screen'] ?? null,
            'role_context' => $roleContext,
            'support_mode' => $isSupportMode,
            'impersonator_id' => $impersonatorId,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Thank you for your feedback.',
                'feedback' => [
                    'ulid' => $feedback->ulid,
                    'category' => $feedback->category,
                    'created_at' => $feedback->created_at->toIso8601String(),
                ],
            ], 201);
        }

        return back()->with('success', 'Thank you for your feedback.');
    }
}
