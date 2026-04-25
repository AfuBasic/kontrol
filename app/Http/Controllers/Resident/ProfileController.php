<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Http\Requests\Resident\UpdateProfileRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Resident/Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'telegram' => [
                'linked' => $user->hasTelegramLinked(),
                'bot_username' => config('services.telegram.bot_username'),
            ],
            'profile' => [
                'unit_number' => $user->profile?->unit_number ?? '',
                'address' => $user->profile?->address ?? '',
            ],
            'stats' => [
                'active_codes_count' => \App\Models\AccessCode::where('user_id', $user->id)->active()->count(),
                'household_members_count' => $user->householdMembers()->count(),
                'last_activity' => $user->notifications()->latest()->first()?->created_at?->diffForHumans() ?? 'No recent activity',
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Update user fields (email is not editable)
        $user->fill([
            'name' => $validated['name'],
        ]);

        $user->save();

        // Update or create user profile with address and unit number
        if (isset($validated['address']) || isset($validated['unit_number'])) {
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'unit_number' => $validated['unit_number'] ?? null,
                    'address' => $validated['address'] ?? null,
                ]
            );
        }

        return back()->with('success', 'Profile updated successfully.');
    }
}
