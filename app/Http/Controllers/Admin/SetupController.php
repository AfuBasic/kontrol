<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SetupController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Show the estate setup onboarding page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $estate = $this->estateContext->getEstate();

        if (! $estate) {
            return redirect()->route('admin.dashboard');
        }

        // If onboarding is already completed, they shouldn't be here.
        if ($estate->settings && $estate->settings->onboarding_completed) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Admin/Setup/Index', [
            'estate' => [
                'id' => $estate->id,
                'name' => $estate->name,
                'address' => $estate->address,
                'settings' => $estate->settings,
            ],
            // Evaluate progress for the UI
            'progress' => [
                'address_completed' => ! empty($estate->address),
                'zones_completed' => $estate->zones()->exists(),
                'security_completed' => $estate->users()->withRole('security', $estate->id)->exists(),
                'residents_completed' => $estate->users()->withRole('resident', $estate->id)->exists(),
            ],
        ]);
    }

    /**
     * Mark the onboarding as complete and redirect to dashboard.
     */
    public function complete(Request $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();

        if ($estate && $estate->settings) {
            $estate->settings->update(['onboarding_completed' => true]);
        }

        return redirect()->route('admin.dashboard')->with('success', 'Setup completed! Welcome to your dashboard.');
    }
}
