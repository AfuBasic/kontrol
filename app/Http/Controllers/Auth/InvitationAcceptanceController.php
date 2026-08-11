<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\ActivateContext;
use App\Actions\Invitation\AcceptInvitationAction;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class InvitationAcceptanceController extends Controller
{
    /**
     * Display the invitation acceptance page.
     */
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = Invitation::withoutGlobalScope(ZoneScope::class)->with(['estate', 'zone', 'role'])->where('token', $token)->first();

        if (! $invitation) {
            abort(404, 'Invitation link is invalid or does not exist.');
        }

        if ($invitation->isCancelled()) {
            return Inertia::render('Auth/AccessDenied', [
                'message' => 'This invitation link has been cancelled.',
            ]);
        }

        if ($invitation->isExpired()) {
            return Inertia::render('Auth/AccessDenied', [
                'message' => 'This invitation link has expired.',
            ]);
        }

        if ($invitation->isAccepted()) {
            if (Auth::check()) {
                return redirect()->route('context.select')->with('info', 'This invitation has already been accepted.');
            }

            return redirect()->route('login')->with('info', 'This invitation has already been accepted. Please log in.');
        }

        $existingUser = User::where('email', strtolower(trim($invitation->email)))->first();

        return Inertia::render('Auth/AcceptInvitation', [
            'invitation' => [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'estate_name' => $invitation->estate->name,
                'relationship_type' => $invitation->relationship_type,
                'zone_name' => $invitation->zone?->name,
            ],
            'userExists' => $existingUser !== null,
            'isAuthenticated' => Auth::check(),
            'currentAuthEmail' => Auth::user()?->email,
        ]);
    }

    /**
     * Process the invitation acceptance.
     */
    public function accept(Request $request, string $token, AcceptInvitationAction $acceptAction): RedirectResponse
    {
        $invitation = Invitation::withoutGlobalScope(ZoneScope::class)->where('token', $token)->firstOrFail();

        if (! $invitation->isPending()) {
            return redirect()->route('login')->with('error', 'This invitation is no longer valid.');
        }

        $email = strtolower(trim($invitation->email));
        $user = Auth::user();

        if (! $user) {
            // Unauthenticated user flow
            $existingUser = User::where('email', $email)->first();

            if ($existingUser) {
                // Existing user accepting via password validation
                $request->validate([
                    'password' => ['required', 'string'],
                ]);

                if (! Auth::attempt(['email' => $email, 'password' => $request->password])) {
                    return redirect()->back()->withErrors(['password' => 'Invalid password for existing account.']);
                }

                $user = Auth::user();
            } else {
                // New user registration
                $request->validate([
                    'name' => ['required', 'string', 'max:255'],
                    'password' => ['required', 'string', 'min:8', 'confirmed'],
                ]);

                $user = User::create([
                    'name' => $request->name,
                    'email' => $email,
                    'password' => Hash::make($request->password),
                    'email_verified_at' => now(),
                ]);

                Auth::login($user);
            }
        }

        // Execute V3 AcceptInvitationAction
        try {
            $acceptAction->execute($invitation, $user);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        // Activate context and route to appropriate portal/picker
        $redirectUrl = app(ActivateContext::class)->execute($user);

        return redirect()->to($redirectUrl)->with('success', 'Invitation accepted successfully!');
    }
}
