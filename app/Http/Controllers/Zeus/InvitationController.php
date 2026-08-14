<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Auth\ActivateContext;
use App\Actions\Invitation\AcceptInvitationAction;
use App\Auth\ContextManager;
use App\Events\ForceLogout;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function show(Request $request, string $token): Response|RedirectResponse
    {
        $invitation = Invitation::withoutGlobalScope(ZoneScope::class)->with('estate')->where('token', $token)->first();

        if (! $invitation) {
            return redirect()->route('invitation.invalid');
        }

        if ($invitation->isAccepted()) {
            if (Auth::check() && strtolower(Auth::user()->email) === strtolower($invitation->email)) {
                return redirect()->route('admin.dashboard');
            }
            return Inertia::render('Invitation/Invalid', [
                'type' => 'admin_accepted',
                'estateName' => $invitation->estate->name,
            ]);
        }

        if ($invitation->isExpired() || $invitation->isCancelled()) {
            return Inertia::render('Invitation/Invalid', [
                'type' => 'admin_expired',
                'estateName' => $invitation->estate->name,
            ]);
        }

        $user = User::where('email', $invitation->email)->first();

        // If the user is logged in but doesn't match the invitation email, log them out.
        if (Auth::check() && strtolower(Auth::user()->email) !== strtolower($invitation->email)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if (! $user) {
            $user = User::firstOrCreate(
                ['email' => strtolower($invitation->email)],
                [
                    'name' => strstr($invitation->email, '@', true) ?: $invitation->email,
                    'email_verified_at' => now(),
                ]
            );
        }

        return Inertia::render('Invitation/AdminActivation', [
            'acceptUrl' => route('invitation.store', ['token' => $token]),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'estate_name' => $invitation->estate->name,
            'token' => $token,
        ]);
    }

    public function store(Request $request, string $token, AcceptInvitationAction $action): RedirectResponse
    {
        $invitation = Invitation::withoutGlobalScope(ZoneScope::class)->where('token', $token)->first();

        if (! $invitation || ! $invitation->isPending()) {
            return redirect()->route('invitation.invalid');
        }

        $user = Auth::user();
        if (! $user) {
            $existingUser = User::where('email', strtolower($invitation->email))->first();
            if ($existingUser) {
                Auth::login($existingUser);
                $user = $existingUser;
            }
        }

        if (! $user || strtolower($user->email) !== strtolower($invitation->email)) {
            return redirect()->route('invitation.invalid');
        }

        try {
            $action->execute($invitation, $user);
        } catch (Exception $e) {
            Log::error('Zeus AcceptInvitationAction failed: '.$e->getMessage(), ['exception' => $e]);

            return redirect()->back()->with('error', $e->getMessage());
        }

        $request->session()->regenerate();
        ForceLogout::dispatchSafely($user->id);

        if ($user->user_type === 'affiliate') {
            app(ContextManager::class)->setSystemContext(0);

            return redirect()->route('partner.dashboard');
        }

        // Initialize the context
        app(ActivateContext::class)->execute($user);

        // Instead of directly going to admin.dashboard, route to setup
        return redirect()->route('admin.setup');
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
