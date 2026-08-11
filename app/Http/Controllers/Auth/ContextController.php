<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ActivateContext;
use App\Http\Controllers\Controller;
use App\Models\AdministrativeAssignment;
use App\Models\EstateMembership;
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
            setPermissionsTeamId(0);

            return redirect()->route('partner.dashboard');
        }

        $assignments = AdministrativeAssignment::with(['estate', 'role', 'zone'])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        if ($assignments->isEmpty()) {
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

        if ($assignments->count() === 1) {
            $redirectUrl = $activateContext->execute($user, $assignments->first());

            if ($redirectUrl) {
                return redirect()->intended($redirectUrl);
            }

            return Inertia::render('Auth/AccessDenied', [
                'message' => 'Your assignment could not be activated.',
            ]);
        }

        // Map assignments for the frontend Context Picker
        $availableContexts = $assignments->map(fn ($assignment) => [
            'id' => $assignment->id,
            'estate_name' => $assignment->estate->name,
            'role_name' => $assignment->role?->name ?? 'Unknown',
            'scope_type' => $assignment->scope_type,
            'zone_name' => $assignment->zone?->name,
            'is_primary' => $assignment->is_primary,
        ])->sortByDesc('is_primary')->values();

        return Inertia::render('Auth/ContextPicker', [
            'availableContexts' => $availableContexts,
        ]);
    }

    /**
     * Handle explicit context switching.
     */
    public function switch(Request $request, ActivateContext $activateContext): RedirectResponse
    {
        $validated = $request->validate([
            'assignment_id' => 'required|integer',
        ]);

        $user = $request->user();

        $assignment = AdministrativeAssignment::where('user_id', $user->id)
            ->where('id', $validated['assignment_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $redirectUrl = $activateContext->execute($user, $assignment);

        if (! $redirectUrl) {
            abort(403, 'Context activation failed or assignment invalid.');
        }

        // Return to the intended dashboard of the new context
        return redirect()->intended($redirectUrl);
    }
}
