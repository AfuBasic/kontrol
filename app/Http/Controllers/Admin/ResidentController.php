<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateResidentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreResidentRequest;
use App\Models\User;
use App\Services\Admin\ResidentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
    public function index(): Response
    {
        $residents = $this->residentService
            ->getPaginatedResidents()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->profile?->phone,
                'unit_number' => $user->profile?->unit_number,
                'status' => $user->estates->first()?->pivot?->status ?? 'pending',
                'created_at' => $user->created_at->format('M d, Y'),
            ]);

        return Inertia::render('admin/residents/index', [
            'residents' => $residents,
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
    public function update(Request $request, User $resident): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($resident, $validated) {
            $resident->update(['name' => $validated['name']]);

            $resident->profile()->updateOrCreate(
                ['user_id' => $resident->id],
                [
                    'phone' => $validated['phone'] ?? null,
                    'unit_number' => $validated['unit_number'] ?? null,
                    'address' => $validated['address'] ?? null,
                ]
            );
        });

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
}
