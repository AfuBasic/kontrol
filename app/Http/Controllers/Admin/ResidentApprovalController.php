<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ResidentApproved;
use App\Notifications\ResidentRejected;
use App\Services\Admin\ResidentService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResidentApprovalController extends Controller
{
    public function __construct(
        protected ResidentService $residentService,
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of pending residents.
     */
    public function index(Request $request): Response
    {
        $this->authorize('residents.view');

        $filters = $request->only(['search']);
        $filters['status'] = 'pending';

        $residents = $this->residentService
            ->getPaginatedResidents(15, $filters)
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->profile?->phone,
                'unit_number' => $user->profile?->unit_number,
                'status' => 'pending',
                'created_at' => $user->created_at->format('M d, Y'),
            ]);

        return Inertia::render('admin/residents/approvals/index', [
            'residents' => $residents,
            'filters' => $filters,
        ]);
    }

    /**
     * Approve a pending resident.
     */
    public function approve(User $user): RedirectResponse
    {
        $this->authorize('residents.edit');
        $estate = $this->estateContext->getEstate();

        $user->estates()->updateExistingPivot($estate->id, [
            'status' => 'accepted',
        ]);

        // Send ResidentApproved notification
        $user->notify(new ResidentApproved($estate));

        return back()->with('success', "{$user->name} has been approved as a resident.");
    }

    /**
     * Reject and remove a pending resident.
     */
    public function reject(User $user): RedirectResponse
    {
        $this->authorize('residents.edit');
        $estate = $this->estateContext->getEstate();

        // Send ResidentRejected notification before detaching/deleting
        $user->notify(new ResidentRejected($estate));

        // Detach from estate
        $user->estates()->detach($estate->id);

        // If the user has no other estates, we could delete them
        if ($user->estates()->count() === 0) {
            $user->delete();
        }

        return back()->with('success', 'Resident application has been rejected and removed.');
    }
}
