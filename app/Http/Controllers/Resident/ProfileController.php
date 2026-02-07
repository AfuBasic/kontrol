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

        return Inertia::render('resident/profile/edit', [
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
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Update user fields
        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

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
