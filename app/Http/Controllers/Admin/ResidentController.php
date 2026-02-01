<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateResidentAction;
use App\Events\Admin\ResidentCreated;
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
        $this->authorize('residents.view');

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
        $this->authorize('residents.create');
        return Inertia::render('admin/residents/create');
    }

    /**
     * Store a newly created resident.
     */
    public function store(StoreResidentRequest $request, CreateResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.create');
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
        $this->authorize('residents.edit');
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
    public function update(
        Request $request, 
        User $resident, 
        \App\Actions\Admin\UpdateResidentAction $action
    ): RedirectResponse
    {
        $this->authorize('residents.edit');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $estate = $this->residentService->getCurrentEstate();
        $action->execute($resident, $validated, $estate);

        return redirect()
            ->route('residents.index')
            ->with('success', 'Resident updated successfully.');
    }

    /**
     * Remove the specified resident.
     */
    public function destroy(User $resident, \App\Actions\Admin\DeleteResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.delete');
        $estate = $this->residentService->getCurrentEstate();
        
        $action->execute($resident, $estate);

        return redirect()
            ->route('residents.index')
            ->with('success', 'Resident removed successfully.');
    }

    /**
     * Toggle the suspension status of the specified resident.
     */
    public function suspend(User $resident, \App\Actions\Admin\SuspendResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.suspend');
        $estate = $this->residentService->getCurrentEstate();
        
        $action->execute($resident, $estate);

        $message = $resident->suspended_at
            ? 'Resident suspended successfully.'
            : 'Resident activated successfully.';

        return back()->with('success', $message);
    }

    /**
     * Reset the password and resend invitation for the specified resident.
     */
    public function resetPassword(User $resident, \App\Actions\Admin\ResetResidentPasswordAction $action): RedirectResponse
    {
        $this->authorize('residents.reset-password');
        $estate = $this->residentService->getCurrentEstate();

        $action->execute($resident, $estate);

        return back()->with('success', 'Resident password reset and invitation resent.');
    }
}
