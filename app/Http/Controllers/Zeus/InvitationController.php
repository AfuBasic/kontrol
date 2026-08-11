<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Auth\ActivateContext;
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

        if ($user->user_type === 'affiliate') {
            setPermissionsTeamId(0);

            return redirect()->route('partner.dashboard');
        }

        $activateContext = app(ActivateContext::class);
        $redirectUrl = $activateContext->execute($user);

        // Security and Resident roles should see the success page
        if ($user->hasRole(['security', 'resident', 'household_member'])) {
            return redirect()->route('invitation.success');
        }

        return redirect()->intended($redirectUrl);
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
