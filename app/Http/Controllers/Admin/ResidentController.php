<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\BulkDeleteResidentsAction;
use App\Actions\Admin\BulkInviteResidentsAction;
use App\Actions\Admin\CreateResidentAction;
use App\Actions\Admin\DeleteResidentAction;
use App\Actions\Admin\ResetResidentPasswordAction;
use App\Actions\Admin\SuspendResidentAction;
use App\Actions\Admin\UpdateResidentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreResidentRequest;
use App\Models\Property;
use App\Models\User;
use App\Services\Admin\ResidentService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ResidentController extends Controller
{
    public function __construct(
        protected ResidentService $residentService,
        protected EstateContextService $estateContext
    ) {
    }

    /**
     * Display a listing of residents.
     */
    public function index(Request $request): Response
    {
        $this->authorize('residents.view');

        $filters = $request->only(['search', 'status']);
        $estate = $this->estateContext->getEstate();

        $residents = Inertia::defer(fn() => $this->residentService
            ->getPaginatedResidents(15, $filters)
            ->through(fn($user) => [
                'id' => $user->id,
                'ulid' => $user->ulid,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->profile?->phone,
                'unit_number' => $user->profile?->unit_number,
                'property_owner_id' => $user->profile?->property_owner_id,
                'property_owner_name' => $user->profile?->propertyOwner?->name,
                'property_id' => $user->profile?->property_id,
                'property_name' => $user->profile?->property?->name,
                'status' => $user->estates->first()?->pivot?->status ?? 'pending',
                'is_property_owner' => $user->roles->contains('name', 'property_owner'),
                'suspended_at' => $user->suspended_at,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at->format('M d, Y'),
            ]));

        $pendingCount = Inertia::defer(fn() => User::query()
            ->whereHas('estates', fn($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'))
            ->count());

        return Inertia::render('Admin/Residents/Index', [
            'residents' => $residents,
            'filters' => $filters,
            'pendingCount' => $pendingCount,
        ]);
    }

    /**
     * Show the form for creating a new resident.
     */
    public function create(): Response
    {
        $this->authorize('residents.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->inviteLink;

        return Inertia::render('Admin/Residents/Create', [
            'inviteLink' => $link ? [
                'token' => $link->token,
                'url' => url("/join/{$link->token}"),
                'is_active' => $link->is_active,
                'usage_count' => $link->usage_count,
                'max_usages' => $link->max_usages,
                'requires_approval' => $link->requires_approval,
                'expires_at' => $link->expires_at?->toDateTimeString(),
                'is_expired' => $link->expires_at?->isPast() ?? false,
            ] : null,
            'propertyOwners' => User::query()
                ->forEstate($estate->id)
                ->withRole('property_owner', $estate->id)
                ->active()
                ->orderBy('name')
                ->get(['users.id', 'users.name'])
                ->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
            'properties' => Property::query()
                ->where('estate_id', $estate->id)
                ->whereNull('archived_at')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created resident.
     */
    public function store(StoreResidentRequest $request, CreateResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.create');
        $estate = $this->estateContext->getEstate();

        $action->execute($request->validated(), $estate);

        return redirect()
            ->route('admin.residents.index')
            ->with('success', 'Resident invited successfully. They will receive an email to set up their account.');
    }

    /**
     * Show the form for editing a resident.
     */
    public function edit(User $resident): Response
    {
        $this->authorize('residents.edit');
        $resident->load(['profile.propertyOwner', 'profile.property']);
        $estate = $this->estateContext->getEstate();

        return Inertia::render('Admin/Residents/Edit', [
            'resident' => [
                'id' => $resident->id,
                'ulid' => $resident->ulid,
                'name' => $resident->name,
                'email' => $resident->email,
                'email_verified_at' => $resident->email_verified_at,
                'phone' => $resident->profile?->phone,
                'unit_number' => $resident->profile?->unit_number,
                'address' => $resident->profile?->address,
                'property_owner_id' => $resident->profile?->property_owner_id,
                'property_id' => $resident->profile?->property_id,
            ],
            'propertyOwners' => User::query()
                ->forEstate($estate->id)
                ->withRole('property_owner', $estate->id)
                ->active()
                ->orderBy('name')
                ->get(['users.id', 'users.name'])
                ->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
        ]);
    }

    /**
     * Update the specified resident.
     */
    public function update(
        Request $request,
        User $resident,
        UpdateResidentAction $action
    ): RedirectResponse {
        $this->authorize('residents.edit');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users')->ignore($resident->id),
                function ($attribute, $value, $fail) use ($resident) {
                    if ($resident->email_verified_at && $value !== $resident->email) {
                        $fail('The email address cannot be changed once the resident has verified their account.');
                    }
                },
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'property_owner_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'property_id' => ['nullable', 'integer', Rule::exists('properties', 'id')],
        ]);

        $estate = $this->estateContext->getEstate();
        $action->execute($resident, $validated, $estate);

        return redirect()
            ->route('admin.residents.index')
            ->with('success', 'Resident updated successfully.');
    }

    /**
     * Remove the specified resident.
     */
    public function destroy(User $resident, DeleteResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.delete');
        $estate = $this->estateContext->getEstate();

        $action->execute($resident, $estate);

        return redirect()
            ->route('admin.residents.index')
            ->with('success', 'Resident removed successfully.');
    }

    /**
     * Toggle the suspension status of the specified resident.
     */
    public function suspend(User $resident, SuspendResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.suspend');
        $estate = $this->estateContext->getEstate();

        $action->execute($resident, $estate);

        $message = $resident->suspended_at
            ? 'Resident suspended successfully.'
            : 'Resident activated successfully.';

        return back()->with('success', $message);
    }

    /**
     * Reset the password and resend invitation for the specified resident.
     */
    public function resetPassword(User $resident, ResetResidentPasswordAction $action): RedirectResponse
    {
        $this->authorize('residents.reset-password');
        $estate = $this->estateContext->getEstate();

        $action->execute($resident, $estate);

        return back()->with('success', 'Resident password reset and invitation resent.');
    }

    /**
     * Bulk invite residents by email.
     */
    public function bulkInvite(Request $request, BulkInviteResidentsAction $action): RedirectResponse
    {
        $this->authorize('residents.create');

        $validated = $request->validate([
            'emails' => ['required', 'array', 'min:1', 'max:500'],
            'emails.*' => ['required', 'email'],
        ]);

        $estate = $this->estateContext->getEstate();
        $result = $action->execute($validated['emails'], $estate);

        $message = "Successfully invited {$result['invited']} resident(s).";
        if ($result['skipped'] > 0) {
            $message .= " {$result['skipped']} email(s) were skipped (already exist).";
        }

        return redirect()
            ->route('admin.residents.index')
            ->with('success', $message);
    }

    /**
     * Bulk delete residents.
     */
    public function bulkDelete(Request $request, BulkDeleteResidentsAction $action): RedirectResponse
    {
        $this->authorize('residents.delete');

        $validated = $request->validate([
            'ids' => ['required_if:all,false', 'array'],
            'all' => ['sometimes', 'boolean'],
            'filters' => ['sometimes', 'array'],
        ]);

        $estate = $this->estateContext->getEstate();
        $ids = $validated['ids'] ?? [];

        if ($request->boolean('all')) {
            $query = User::query()
                ->whereHas('estates', fn($q) => $q->where('estates.id', $estate->id));

            if ($request->filled('filters.search')) {
                $search = $request->input('filters.search');
                $query->where(fn($q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"));
            }

            if ($request->filled('filters.status')) {
                $status = $request->input('filters.status');
                $query->whereHas('estates', fn($q) => $q->where('estates.id', $estate->id)
                    ->where('estate_users_membership.status', $status));
            }

            $ids = $query->pluck('users.id')->toArray();
        }

        $result = $action->execute($ids, $estate);

        $total = $result['deleted'] + $result['detached'];

        return redirect()
            ->route('admin.residents.index')
            ->with('success', "Successfully removed {$total} resident(s).");
    }
}
