<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\Admin\ResidentAcceptedInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

    public function store(Request $request, User $user): RedirectResponse
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

        DB::transaction(function () use ($user, $validated, $request) {
            // Set the user's password
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            // Update pivot status to accepted
            DB::table('estate_users_membership')
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->update(['status' => 'accepted']);

            // Activate the estate(s) associated with this user
            // Assuming for now a user accepts for one estate context in this flow
            // Ideally we'd pass the estate ID in the invitation link but for now finding the estate via pivot works
            // if we assume 1:1 for this specific flow or activate all pending ones since this is the first user.
            // Given the CreateEstateAction flow, there is one estate.
            $user->estates()->update(['estates.status' => 'active']);

            // Notify Estate Admins if the accepting user is a resident or security personnel
            $estate = $user->estates()->first();
            $isPasswordReset = $request->boolean('password_reset');

            if ($estate) {
                // Set the team/estate context for the permission check
                setPermissionsTeamId($estate->id);

                // Reload roles to ensure the new team context is respected
                $user->unsetRelation('roles');

                if ($user->hasRole(['resident', 'security'])) {
                    DB::afterCommit(function () use ($user, $estate, $isPasswordReset) {
                        User::withRole('admin', $estate->id)
                            ->get()
                            ->each(function ($admin) use ($user, $isPasswordReset) {
                                $admin->notify(new ResidentAcceptedInvitation($user, $isPasswordReset));
                            });
                    });
                }
            }
        });

        // Log the user in
        Auth::login($user);

        // Redirect to their estate dashboard
        // TODO: Replace with actual estate dashboard route
        return redirect()->intended('/dashboard');
    }

    public function invalid(): Response
    {
        return Inertia::render('invitation/invalid');
    }
}
