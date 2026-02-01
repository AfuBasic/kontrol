<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateResidentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreResidentRequest;
use App\Models\User;
use App\Services\Admin\ResidentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResidentController extends Controller
{
    public function __construct(
        protected ResidentService $residentService,
    ) {}

    /**
     * Display a listing of residents.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);

        $residents = $this->residentService
            ->getPaginatedResidents(15, $filters)
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->profile?->phone,
                'unit_number' => $user->profile?->unit_number,
                'status' => $user->estates->first()?->pivot?->status ?? 'pending',
                'suspended_at' => $user->suspended_at,
                'created_at' => $user->created_at->format('M d, Y'),
            ]);

        return Inertia::render('admin/residents/index', [
            'residents' => $residents,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new resident.
     */
    public function create(): Response
    {
        return Inertia::render('admin/residents/create');
    }

    /**
     * Store a newly created resident.
     */
    public function store(StoreResidentRequest $request, CreateResidentAction $action): RedirectResponse
    {
        $estate = $this->residentService->getCurrentEstate();

        $action->execute($request->validated(), $estate);

        return redirect()
            ->route('residents.index')
            ->with('success', 'Resident invited successfully. They will receive an email to set up their account.');
    }

    /**
     * Show the form for editing a resident.
     */
    public function edit(User $resident): Response
    {
        $resident->load('profile');

        return Inertia::render('admin/residents/edit', [
            'resident' => [
                'id' => $resident->id,
                'name' => $resident->name,
                'email' => $resident->email,
                'phone' => $resident->profile?->phone,
                'unit_number' => $resident->profile?->unit_number,
                'address' => $resident->profile?->address,
            ],
        ]);
    }

    /**
     * Update the specified resident.
     */
    public function update(Request $request, User $resident, \App\Actions\Admin\UpdateResidentAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $action->execute($resident, $validated);

        return redirect()
            ->route('residents.index')
            ->with('success', 'Resident updated successfully.');
    }

    /**
     * Remove the specified resident.
     */
    public function destroy(User $resident): RedirectResponse
    {
        $resident->delete();

        return redirect()
            ->route('residents.index')
            ->with('success', 'Resident removed successfully.');
    }

    /**
     * Toggle the suspension status of the specified resident.
     */
    public function suspend(User $resident): RedirectResponse
    {
        $resident->update([
            'suspended_at' => $resident->suspended_at ? null : now(),
        ]);

        $message = $resident->suspended_at
            ? 'Resident suspended successfully.'
            : 'Resident activated successfully.';

        return back()->with('success', $message);
    }

    /**
     * Reset the password and resend invitation for the specified resident.
     */
    public function resetPassword(User $resident): RedirectResponse
    {
        $estate = $this->residentService->getCurrentEstate();

        // 1. Reset password
        $resident->update(['password' => null]);

        // 2. Set status to pending for the current estate
        $resident->estates()->updateExistingPivot($estate->id, ['status' => 'pending']);

        // 3. Resend invitation email
        event(new \App\Events\Admin\ResidentCreated($resident, $estate, true));

        return back()->with('success', 'Resident password reset and invitation resent.');
    }
}
