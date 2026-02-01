<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateSecurityAction;
use App\Actions\Admin\UpdateSecurityAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSecurityRequest;
use App\Models\User;
use App\Services\Admin\SecurityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SecurityPersonnelController extends Controller
{
    public function __construct(
        protected SecurityService $securityService,
    ) {}

    /**
     * Display a listing of security personnel.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);

        $security = $this->securityService
            ->getPaginatedSecurity(15, $filters)
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->profile?->phone,
                'badge_number' => $user->profile?->metadata['badge_number'] ?? null,
                'status' => $user->estates->first()?->pivot?->status ?? 'pending',
                'suspended_at' => $user->suspended_at,
                'created_at' => $user->created_at->format('M d, Y'),
            ]);

        return Inertia::render('admin/security/index', [
            'security' => $security,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating new security personnel.
     */
    public function create(): Response
    {
        return Inertia::render('admin/security/create');
    }

    /**
     * Store newly created security personnel.
     */
    public function store(StoreSecurityRequest $request, CreateSecurityAction $action): RedirectResponse
    {
        $estate = $this->securityService->getCurrentEstate();

        $action->execute($request->validated(), $estate);

        return redirect()
            ->route('security.index')
            ->with('success', 'Security personnel invited successfully. They will receive an email to set up their account.');
    }

    /**
     * Show the form for editing security personnel.
     */
    public function edit(User $security): Response
    {
        $security->load('profile');

        return Inertia::render('admin/security/edit', [
            'security' => [
                'id' => $security->id,
                'name' => $security->name,
                'email' => $security->email,
                'phone' => $security->profile?->phone,
                'badge_number' => $security->profile?->metadata['badge_number'] ?? null,
            ],
        ]);
    }

    /**
     * Update the specified security personnel.
     */
    public function update(Request $request, User $security, UpdateSecurityAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'badge_number' => ['nullable', 'string', 'max:50'],
        ]);

        $action->execute($security, $validated);

        return redirect()
            ->route('security.index')
            ->with('success', 'Security personnel updated successfully.');
    }

    /**
     * Remove the specified security personnel.
     */
    public function destroy(User $security): RedirectResponse
    {
        $security->delete();

        return redirect()
            ->route('security.index')
            ->with('success', 'Security personnel removed successfully.');
    }

    /**
     * Toggle the suspension status of the specified security personnel.
     */
    public function suspend(User $security): RedirectResponse
    {
        $security->update([
            'suspended_at' => $security->suspended_at ? null : now(),
        ]);

        $message = $security->suspended_at
            ? 'Security personnel suspended successfully.'
            : 'Security personnel activated successfully.';

        return back()->with('success', $message);
    }

    /**
     * Reset the password and resend invitation for the specified security personnel.
     */
    public function resetPassword(User $security): RedirectResponse
    {
        $estate = $this->securityService->getCurrentEstate();

        // 1. Reset password
        $security->update(['password' => null]);

        // 2. Set status to pending for the current estate
        $security->estates()->updateExistingPivot($estate->id, ['status' => 'pending']);

        // 3. Resend invitation email
        event(new \App\Events\Admin\SecurityCreated($security, $estate, true));

        return back()->with('success', 'Security personnel password reset and invitation resent.');
    }
}
