<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Auth\ActivateContext;
use App\Auth\ContextManager;
use App\Actions\Invitation\AcceptInvitationAction;
use App\Events\ForceLogout;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function show(Request $request, string $token): Response|RedirectResponse
    {
        $invitation = Invitation::where('token', $token)->first();

        if (! $invitation || ! $invitation->isPending()) {
            return redirect()->route('invitation.invalid');
        }

        $user = User::where('email', $invitation->email)->first();
        
        // If the user is logged in but doesn't match the invitation email, log them out.
        if (Auth::check() && strtolower(Auth::user()->email) !== strtolower($invitation->email)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if (! $user) {
            // New user: Needs to register. We can redirect to the join form using the token.
            // Wait, we have InviteRegistrationController which uses `EstateInviteLink`. Let's just use Inertia Auth/Join.
            // Since this is for specific invitations, we could just redirect them to a registration flow, or render a specific view here.
            // But to keep it simple, we'll render 'Invitation/Register' if it existed, or we can use the same view if the frontend handles it, but since we are modifying backend:
            // For now, let's just pass `user => null` to tell the frontend they need to register.
            // Or better yet, we redirect them to standard register with pre-filled email.
            return redirect()->route('register', ['email' => $invitation->email, 'invitation_token' => $token]);
        }

        // If user is not logged in but exists, they must log in to accept.
        if (! Auth::check()) {
            return redirect()->route('login', ['email' => $invitation->email, 'invitation_token' => $token]);
        }

        return Inertia::render('Invitation/Accept', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'isPasswordReset' => false,
            'token' => $token,
        ]);
    }

    public function store(Request $request, string $token, AcceptInvitationAction $action): RedirectResponse
    {
        $invitation = Invitation::where('token', $token)->first();

        if (! $invitation || ! $invitation->isPending()) {
            return redirect()->route('invitation.invalid');
        }

        $user = Auth::user();
        if (! $user || strtolower($user->email) !== strtolower($invitation->email)) {
            return redirect()->route('invitation.invalid');
        }

        $action->execute($invitation, $user);

        $request->session()->regenerate();
        ForceLogout::dispatchSafely($user->id);

        if ($user->user_type === 'affiliate') {
            app(ContextManager::class)->setSystemContext(0);
            return redirect()->route('partner.dashboard');
        }

        $activateContext = app(ActivateContext::class);
        $redirectUrl = $activateContext->execute($user);

        // Security and Resident roles should see the success page
        if ($user->contextHasRole(['security', 'resident', 'household_member'])) {
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
