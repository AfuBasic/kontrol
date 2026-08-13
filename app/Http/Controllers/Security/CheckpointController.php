<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\EstateSettings;
use App\Services\EstateContextService;
use App\Services\Security\CheckpointClaimService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckpointController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContextService,
        protected CheckpointClaimService $checkpointClaimService
    ) {}

    /**
     * Display the checkpoint selection UI.
     */
    public function select(Request $request): Response
    {
        $user = $request->user();
        $estate = $this->estateContextService->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        $configuredPoints = $settings->entry_points ?: [];
        $checkpoints = $this->checkpointClaimService->getCheckpointStatuses(
            $estate->id,
            $configuredPoints,
            $user
        );

        $currentCheckpoint = $this->checkpointClaimService->getCurrentCheckpoint($estate->id, $user);

        return Inertia::render('Security/Checkpoint/Select', [
            'estateName' => $estate->name,
            'checkpoints' => $checkpoints,
            'currentCheckpoint' => $currentCheckpoint,
            'enforced' => (bool) $settings->entry_point_checkout_enforced,
        ]);
    }

    /**
     * Claim an entry point checkpoint.
     */
    public function claim(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'entry_point' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $estate = $this->estateContextService->getEstate();

        $claimed = $this->checkpointClaimService->claim(
            $estate->id,
            $user,
            $validated['entry_point']
        );

        if (! $claimed) {
            return back()->with('error', "The entry point '{$validated['entry_point']}' is currently occupied by another guard.");
        }

        return redirect()->route('security.home')->with('success', "Active checkpoint set to {$validated['entry_point']}.");
    }

    /**
     * Release the active checkpoint.
     */
    public function release(Request $request): RedirectResponse
    {
        $user = $request->user();
        $estate = $this->estateContextService->getEstate();

        $this->checkpointClaimService->release($estate->id, $user);

        return redirect()->route('security.checkpoint.select')->with('success', 'Checkpoint released.');
    }
}
