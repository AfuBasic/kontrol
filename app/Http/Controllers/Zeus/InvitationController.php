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

        if ($invitation) {
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

        // Check for partner / affiliate member invitation
        $partnerUser = User::with('partner')->where('id', $token)->where('user_type', 'affiliate')->first();

        if ($partnerUser && $partnerUser->partner) {
            if ($request->has('signature') && ! $request->hasValidSignature()) {
                return Inertia::render('Invitation/Invalid', [
                    'type' => 'admin_expired',
                    'estateName' => $partnerUser->partner->name,
                ]);
            }

            if ($partnerUser->email_verified_at && Auth::check() && Auth::id() === $partnerUser->id) {
                return redirect()->route('partner.dashboard');
            }

            // If the user is logged in but doesn't match the partner email, log them out.
            if (Auth::check() && strtolower(Auth::user()->email) !== strtolower($partnerUser->email)) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return Inertia::render('Invitation/PartnerActivation', [
                'acceptUrl' => route('invitation.store', array_merge(['token' => $token], $request->query())),
                'user' => [
                    'id' => $partnerUser->id,
                    'name' => $partnerUser->name,
                    'email' => $partnerUser->email,
                ],
                'partner_name' => $partnerUser->partner->name,
                'token' => $token,
            ]);
        }

        return redirect()->route('invitation.invalid');
    }

    public function store(Request $request, string $token, AcceptInvitationAction $action): RedirectResponse
    {
        $invitation = Invitation::withoutGlobalScope(ZoneScope::class)->where('token', $token)->first();

        if ($invitation) {
            if (! $invitation->isPending()) {
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

            // Initialize the context
            app(ActivateContext::class)->execute($user);

            // Instead of directly going to admin.dashboard, route to setup
            return redirect()->route('admin.setup');
        }

        // Partner / affiliate member activation
        $partnerUser = User::with('partner')->where('id', $token)->where('user_type', 'affiliate')->first();

        if ($partnerUser && $partnerUser->partner) {
            if ($request->has('signature') && ! $request->hasValidSignature()) {
                return redirect()->route('invitation.invalid');
            }

            $partnerUser->update([
                'email_verified_at' => $partnerUser->email_verified_at ?? now(),
            ]);

            if ($partnerUser->partner->status === 'pending') {
                $partnerUser->partner->update(['status' => 'active']);
            }

            Auth::login($partnerUser);
            $request->session()->regenerate();
            app(ContextManager::class)->setSystemContext(0);

            return redirect()->route('partner.dashboard');
        }

        return redirect()->route('invitation.invalid');
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
