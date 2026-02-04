<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\UpdateSecurityProfileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Security\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected UpdateSecurityProfileAction $updateProfileAction,
    ) {}

    public function edit(): Response
    {
        $user = auth()->user();
        $estate = $user->getCurrentEstate();

        return Inertia::render('security/profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'estateName' => $estate->name,
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = auth()->user();

        $this->updateProfileAction->execute($user, $request->validated());

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }
}
