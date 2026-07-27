<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\AcceptInvitationAction;
use App\Events\ForceLogout;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function show(Request $request, User $user): Response|RedirectResponse
    {
        $isPasswordReset = $request->boolean('password_reset');

        $hasPendingInvitations = DB::table('estate_users_membership')
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        // Check if invitation was already used
        if (! $isPasswordReset && ! $hasPendingInvitations && $user->email_verified_at !== null) {
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

        $hasPendingInvitations = DB::table('estate_users_membership')
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        // Check if invitation was already used
        if (! $isPasswordReset && ! $hasPendingInvitations && $user->email_verified_at !== null) {
            return redirect()->route('invitation.invalid');
        }

        $action->execute($user, [
            'password_reset' => $request->boolean('password_reset'),
        ]);

        // Log the user in
        Auth::login($user);

        $request->session()->regenerate();
        ForceLogout::dispatchSafely($user->id);

        // Redirect based on role
        if ($user->user_type === 'affiliate') {
            setPermissionsTeamId(0);

            return redirect()->route('partner.dashboard');
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
