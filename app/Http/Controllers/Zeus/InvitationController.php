<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\AcceptInvitationAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function show(Request $request, User $user): Response|RedirectResponse
    {
        // Validate signed URL
        if (! $request->hasValidSignature()) {
            return redirect()->route('invitation.invalid');
        }

        // Check if user already has a password (invitation already used)
        if ($user->password !== null) {
            return redirect()->route('invitation.invalid');
        }

        return Inertia::render('invitation/accept', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function store(Request $request, User $user, AcceptInvitationAction $action): RedirectResponse
    {
        // Validate signed URL
        if (! $request->hasValidSignature()) {
            return redirect()->route('invitation.invalid');
        }

        // Check if invitation was already used
        if ($user->password !== null) {
            return redirect()->route('invitation.invalid');
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $action->execute($user, array_merge($validated, [
            'password_reset' => $request->boolean('password_reset'),
        ]));

        // Log the user in
        Auth::login($user);

        // Redirect based on role
        if ($estate = $user->estates()->first()) {
            setPermissionsTeamId($estate->id);
            // Reload roles to ensure proper scope
            $user->unsetRelation('roles');
        }

        if ($user->hasRole('security')) {
            return redirect()->route('security.dashboard');
        }

        if ($user->hasRole('resident')) {
            return redirect()->route('resident.dashboard');
        }

        return redirect()->route('admin.dashboard');
    }

    public function invalid(): Response
    {
        return Inertia::render('invitation/invalid');
    }
}
