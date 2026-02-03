<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateSecurityAction;
use App\Actions\Admin\DeleteSecurityAction;
use App\Actions\Admin\ResetSecurityPasswordAction;
use App\Actions\Admin\SuspendSecurityAction;
use App\Actions\Admin\UpdateSecurityAction;
use App\Events\Admin\SecurityCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSecurityRequest;
use App\Models\User;
use App\Services\Admin\SecurityService;
use App\Services\Admin\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SecurityPersonnelController extends Controller
{
    public function __construct(
        protected SecurityService $securityService,
        protected UserService $userService
    ) {}

    /**
     * Display a listing of security personnel.
     */
    public function index(Request $request): Response
    {
        $this->authorize('security.view');

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
        $this->authorize('security.create');
        return Inertia::render('admin/security/create');
    }

    /**
     * Store newly created security personnel.
     */
    public function store(StoreSecurityRequest $request, CreateSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.create');
        $estate = $this->userService->getCurrentEstate();

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
        $this->authorize('security.edit');
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
        $this->authorize('security.edit');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'badge_number' => ['nullable', 'string', 'max:50'],
        ]);

        $estate = $this->userService->getCurrentEstate();
        $action->execute($security, $validated, $estate);

        return redirect()
            ->route('security.index')
            ->with('success', 'Security personnel updated successfully.');
    }

    /**
     * Remove the specified security personnel.
     */
    public function destroy(User $security, DeleteSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.delete');
        $estate = $this->userService->getCurrentEstate();
        
        $action->execute($security, $estate);

        return redirect()
            ->route('security.index')
            ->with('success', 'Security personnel removed successfully.');
    }

    /**
     * Toggle the suspension status of the specified security personnel.
     */
    public function suspend(User $security, SuspendSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.suspend');
        $estate = $this->userService->getCurrentEstate();
        
        $action->execute($security, $estate);

        $message = $security->suspended_at
            ? 'Security personnel suspended successfully.'
            : 'Security personnel activated successfully.';

        return back()->with('success', $message);
    }

    /**
     * Reset the password and resend invitation for the specified security personnel.
     */
    public function resetPassword(User $security, ResetSecurityPasswordAction $action): RedirectResponse
    {
        $this->authorize('security.reset-password');
        $estate = $this->userService->getCurrentEstate();

        $action->execute($security, $estate);

        return back()->with('success', 'Security personnel password reset and invitation resent.');
    }
}
