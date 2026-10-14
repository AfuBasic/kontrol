<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ActivateContext;
use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Models\AdministrativeAssignment;
use App\Models\EstateMembership;
use App\Models\User;
use App\Services\Auth\WorkspaceService;
use App\Services\OrganizationContextService;
use App\Services\Security\CheckpointClaimService;
use App\Support\IntendedDestinationGuard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContextController extends Controller
{
    /**
     * Show the context picker or auto-activate if only 1 context is available.
     */
    public function index(Request $request, ActivateContext $activateContext): Response|RedirectResponse
    {
        $user = $request->user();

        // Partner portal members are outside the normal estate context logic.
        if ($user->user_type === 'affiliate') {
            app(ContextManager::class)->setSystemContext(0);

            return redirect()->route('partner.dashboard');
        }

        $contextManager = app(ContextManager::class);
        $assignments = $contextManager->getValidAssignments($user);
        $organizations = app(WorkspaceService::class)->organizationMemberships($user);

        if ($assignments->isEmpty()) {
            if ($organizations->isNotEmpty() || $user->organizationMemberships()->where('is_active', true)->exists()) {
                return redirect()->route('org.dashboard');
            }

            $hasPending = EstateMembership::where('user_id', $user->id)
                ->where('status', 'pending')
                ->exists();

            if ($hasPending) {
                return Inertia::render('Auth/AccessDenied', [
                    'message' => 'You have pending invitations. Please check your email and click the invitation link to gain access.',
                ]);
            }

            return Inertia::render('Auth/AccessDenied', [
                'message' => 'You do not have any active assignments or estate memberships. Please contact your administrator.',
            ]);
        }

        // One workspace, and nothing to choose between: go straight in.
        if ($assignments->count() === 1 && $organizations->isEmpty()) {
            $redirectUrl = $activateContext->execute($user, $assignments->first());

            if ($redirectUrl) {
                return $this->redirectAfterActivation($request, $user, $redirectUrl);
            }

            return Inertia::render('Auth/AccessDenied', [
                'message' => 'Your assignment could not be activated.',
            ]);
        }

        $currentContext = $contextManager->current();
        $activeOrganizationId = $currentContext ? null : session(OrganizationContextService::SESSION_KEY);

        // Estate roles and organizations side by side, so a person who is both is asked which to enter.
        $estateContexts = $assignments->map(fn ($assignment) => [
            'type' => 'estate',
            'id' => $assignment->id,
            'organization_id' => null,
            'estate_name' => $assignment->estate->name,
            'role_name' => $assignment->role?->name ?? 'Unknown',
            'scope_type' => $assignment->scope_type,
            'zone_name' => $assignment->zone?->name,
            'is_primary' => $assignment->is_primary,
            'is_current' => $currentContext && $currentContext->assignmentId === $assignment->id,
        ])->sortByDesc('is_primary');

        $organizationContexts = $organizations->map(fn ($membership) => [
            'type' => 'organization',
            'id' => null,
            'organization_id' => $membership->organization_id,
            'estate_name' => $membership->organization->name,
            'role_name' => $membership->role === 'admin' ? 'organization admin' : 'organization staff',
            'scope_type' => 'organization',
            'zone_name' => null,
            'is_primary' => false,
            'is_current' => $activeOrganizationId !== null && (int) $activeOrganizationId === $membership->organization_id,
        ]);

        return Inertia::render('Auth/ContextPicker', [
            'availableContexts' => $estateContexts->concat($organizationContexts)->values(),
        ]);
    }

    /**
     * Handle explicit context switching.
     */
    public function switch(Request $request, ActivateContext $activateContext): RedirectResponse
    {
        $validated = $request->validate([
            'assignment_id' => 'nullable|integer|required_without:organization_id',
            'organization_id' => 'nullable|integer|required_without:assignment_id',
        ]);

        $user = $request->user();

        if (! empty($validated['organization_id'])) {
            return $this->enterOrganization($request, $user, (int) $validated['organization_id']);
        }

        $assignment = AdministrativeAssignment::where('user_id', $user->id)
            ->where('id', $validated['assignment_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $redirectUrl = $activateContext->execute($user, $assignment);

        if (! $redirectUrl || $redirectUrl === url('/')) {
            abort(403, 'Context activation failed or assignment invalid.');
        }

        return $this->redirectAfterActivation($request, $user, $redirectUrl);
    }

    /**
     * Enter an organization workspace. Any estate context is put down first, so the person is in one place at a time.
     */
    private function enterOrganization(Request $request, User $user, int $organizationId): RedirectResponse
    {
        $contextManager = app(ContextManager::class);

        $belongs = app(WorkspaceService::class)->organizationMemberships($user)->contains('organization_id', $organizationId);
        abort_unless($belongs, 403, 'You do not have access to this organization.');

        // A guard signed on to a gate gives it up when they change workspace.
        $currentContext = $contextManager->current();
        if ($currentContext) {
            app(CheckpointClaimService::class)->release($currentContext->estateId, $user);
        }

        app(OrganizationContextService::class)->switchOrganization($organizationId);
        $request->session()->forget('active_context_assignment_id');
        $contextManager->clear();

        return $this->redirectAfterActivation($request, $user, route('org.dashboard'));
    }

    private function redirectAfterActivation(Request $request, User $user, string $fallbackUrl): RedirectResponse
    {
        $intended = $request->session()->pull('url.intended');

        if (app(IntendedDestinationGuard::class)->allows($user, $intended)) {
            return redirect()->to($intended);
        }

        return redirect()->to($fallbackUrl);
    }
}
