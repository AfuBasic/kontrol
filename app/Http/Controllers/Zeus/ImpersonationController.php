<?php

namespace App\Services\Zeus;

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\StartImpersonationAction;
use App\Actions\Zeus\StopImpersonationAction;
use App\Http\Controllers\Controller;
use App\Models\Estate;
use App\Models\User;
use App\Services\Zeus\ImpersonationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ImpersonationController extends Controller
{
    /**
     * Show the administrator selection screen for initiating Support Mode.
     */
    public function selectAdmin(Estate $estate, ImpersonationService $impersonationService): Response
    {
        $admins = $impersonationService->getEligibleAdminsForEstate($estate)
            ->map(function (User $user) {
                $assignment = $user->administrativeAssignments->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $assignment?->role?->name ?? 'Administrator',
                    'scope_type' => $assignment?->scope_type instanceof \BackedEnum ? $assignment->scope_type->value : (string) $assignment?->scope_type,
                    'zone_name' => $assignment?->zone?->name,
                    'is_primary' => (bool) $assignment?->is_primary,
                ];
            })
            ->values();

        return Inertia::render('Zeus/Estates/Impersonate', [
            'estate' => [
                'id' => $estate->id,
                'name' => $estate->name,
                'status' => $estate->status,
                'email' => $estate->email,
                'address' => $estate->address,
            ],
            'admins' => $admins,
        ]);
    }

    /**
     * Start the impersonation / Support Mode session.
     */
    public function start(Request $request, Estate $estate, StartImpersonationAction $startImpersonation): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $targetUser = User::findOrFail($validated['user_id']);

        $startImpersonation->execute(
            estate: $estate,
            targetUser: $targetUser,
            request: $request,
            reason: $validated['reason'] ?? null
        );

        return redirect()->route('admin.dashboard')->with('success', "Support Mode activated. You are now operating as {$targetUser->name}.");
    }

    /**
     * Stop the impersonation / Support Mode session and return to Zeus.
     */
    public function stop(Request $request, StopImpersonationAction $stopImpersonation): RedirectResponse
    {
        $estate = $stopImpersonation->execute($request);

        if ($estate) {
            return redirect()->route('zeus.estates.show', $estate)->with('success', 'Support Mode ended. Returned to Zeus.');
        }

        return redirect()->route('zeus.estates.index')->with('success', 'Support Mode ended. Returned to Zeus.');
    }
}
