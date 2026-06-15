<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\AcceptInvitationAction;
use App\Events\ForceLogout;
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
        $isPasswordReset = $request->boolean('password_reset');

        // Check if user already has a password (invitation already used) — skip for password resets
        if (! $isPasswordReset && $user->password !== null) {
            return redirect()->route('invitation.invalid');
        }

        return Inertia::render('Invitation/Accept', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'isPasswordReset' => $isPasswordReset,
        ]);
    }

    public function store(Request $request, User $user, AcceptInvitationAction $action): RedirectResponse
    {
        $isPasswordReset = $request->boolean('password_reset');

        // Check if invitation was already used — skip for password resets
        if (! $isPasswordReset && $user->password !== null) {
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

        $request->session()->regenerate();
        broadcast(new ForceLogout($user->id));
        Auth::logoutOtherDevices($validated['password']);

        // Redirect based on role
        if ($user->hasRole('affiliate')) {
            return redirect()->route('affiliate.dashboard');
        }

        if ($estate = $user->estates()->first()) {
            setPermissionsTeamId($estate->id);
            // Reload roles to ensure proper scope
            $user->unsetRelation('roles');
        }

        if ($user->hasRole(['security', 'resident'])) {
            return redirect()->route('invitation.success');
        }

        return redirect()->route('admin.dashboard');
    }

    public function success(): Response
    {
        return Inertia::render('Invitation/Success');
    }

    public function invalid(): Response
    {
        return Inertia::render('Invitation/Invalid');
    }
}
