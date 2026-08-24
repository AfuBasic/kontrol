<?php

namespace App\Http\Controllers\Admin;

use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Models\Estate;
use App\Models\User;
use App\Notifications\ResidentApproved;
use App\Notifications\ResidentRejected;
use App\Services\Admin\ResidentService;
use App\Services\EstateContextService;
use Illuminate\Database\Eloquent\Builder;
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

        $estate = $this->estateContext->getEstate();
        app(ContextManager::class)->setSystemContext($estate->id);

        $paginated = $this->residentService->getPaginatedResidents(15, $filters);
        $paginated->load('roles');

        $residents = $paginated->through(fn ($user) => [
            'ulid' => $user->ulid,
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->profile?->phone,
            'unit_number' => $user->profile?->unit_number,
            'status' => 'pending',
            'is_property_owner' => $user->roles->contains('name', 'property_owner'),
            'created_at_human' => $user->created_at->format('M d, Y'),
            'created_at' => $user->created_at->format('M d, Y'),
        ]);

        return Inertia::render('Admin/Residents/Approvals/Index', [
            'residents' => $residents,
            'filters' => (object) $filters,
        ]);
    }

    /**
     * Approve a pending resident.
     */
    public function approve(User $user): RedirectResponse
    {
        $this->authorize('residents.edit');
        $estate = $this->estateContext->getEstate();
        $this->authorizePendingResident($user, $estate);

        $user->estates()->updateExistingPivot($estate->id, [
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        // Send ResidentApproved notification
        $user->notify(new ResidentApproved($estate));

        return back()->with('success', "{$user->name} has been approved as a resident.");
    }

    /**
     * Approve all pending residents for the estate.
     */
    public function approveAll(Request $request): RedirectResponse
    {
        $this->authorize('residents.edit');
        $estate = $this->estateContext->getEstate();

        $pendingUsers = $this->pendingResidentQuery($estate)->get();

        if ($pendingUsers->isEmpty()) {
            return back()->with('info', 'No pending residents to approve.');
        }

        foreach ($pendingUsers as $user) {
            $user->estates()->updateExistingPivot($estate->id, [
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);
            $user->notify(new ResidentApproved($estate));
        }

        return back()->with('success', "{$pendingUsers->count()} pending residents have been approved.");
    }

    /**
     * Reject and remove a pending resident.
     */
    public function reject(User $user): RedirectResponse
    {
        $this->authorize('residents.edit');
        $estate = $this->estateContext->getEstate();
        $this->authorizePendingResident($user, $estate);

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

    private function authorizePendingResident(User $user, Estate $estate): void
    {
        $context = app(ContextManager::class)->current();

        abort_if($context && ! $context->canAccess($user), 403, 'Unauthorized zone scope.');
        abort_unless($this->pendingResidentQuery($estate)->whereKey($user->id)->exists(), 404);
    }

    private function pendingResidentQuery(Estate $estate): Builder
    {
        return User::query()
            ->forEstate($estate->id)
            ->topLevelResident($estate->id)
            ->whereHas('estates', function ($query) use ($estate) {
                $query->where('estates.id', $estate->id)
                    ->where('estate_users_membership.status', 'pending');
            });
    }
}
