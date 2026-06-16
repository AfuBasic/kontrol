<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\AssignResidentsToPropertyOwnerAction;
use App\Actions\Admin\BulkInvitePropertyOwnersAction;
use App\Actions\Admin\CreatePropertyOwnerAction;
use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PropertyOwnerController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of property owners.
     */
    public function index(Request $request): Response
    {
        $this->authorize('property_owners.view');

        $estate = $this->estateContext->getEstate();
        $filters = $request->only(['search', 'status']);

        $propertyOwners = User::query()
            ->forEstate($estate->id)
            ->withRole('property_owner', $estate->id)
            ->with(['profile', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
            ->withCount([
                'properties' => fn ($q) => $q->where('estate_id', $estate->id),
                'managedResidents',
            ])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) use ($estate) {
                if ($status === 'suspended') {
                    $query->whereNotNull('suspended_at');
                } elseif ($status === 'active') {
                    $query->active()
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'accepted'));
                } elseif ($status === 'pending') {
                    $query->whereNull('suspended_at')
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));
                }
            })
            ->latest()
            ->paginate(15)
            ->through(fn ($user) => [
                'id' => $user->id,
                'ulid' => $user->ulid,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->profile?->phone,
                'unit_number' => $user->profile?->unit_number,
                'status' => $user->estates->first()?->pivot?->status ?? 'pending',
                'suspended_at' => $user->suspended_at,
                'email_verified_at' => $user->email_verified_at,
                'properties_count' => $user->properties_count,
                'residents_count' => $user->managed_residents_count,
                'created_at' => $user->created_at->format('M d, Y'),
            ])
            ->withQueryString();

        return Inertia::render('Admin/PropertyOwners/Index', [
            'propertyOwners' => $propertyOwners,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new property owner.
     */
    public function create(): Response
    {
        $this->authorize('property_owners.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->propertyOwnerInviteLink;

        return Inertia::render('Admin/PropertyOwners/Create', [
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
        ]);
    }

    /**
     * Bulk invite property owners by email.
     */
    public function bulkInvite(Request $request, BulkInvitePropertyOwnersAction $action): RedirectResponse
    {
        $this->authorize('property_owners.create');

        $validated = $request->validate([
            'emails' => ['required', 'array', 'min:1', 'max:500'],
            'emails.*' => ['required', 'email'],
        ]);

        $estate = $this->estateContext->getEstate();
        $result = $action->execute($validated['emails'], $estate);

        $message = "Successfully invited {$result['invited']} property owner(s).";
        if ($result['skipped'] > 0) {
            $message .= " {$result['skipped']} email(s) were skipped (already exist).";
        }

        return redirect()
            ->route('admin.property-owners.index')
            ->with('success', $message);
    }

    /**
     * Store a newly created property owner.
     */
    public function store(Request $request, CreatePropertyOwnerAction $action): RedirectResponse
    {
        $this->authorize('property_owners.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $estate = $this->estateContext->getEstate();
        $action->execute($validated, $estate);

        return redirect()
            ->route('admin.property-owners.index')
            ->with('success', 'Property Owner invited successfully. They will receive an email to set up their account.');
    }

    /**
     * Show the form for editing a property owner.
     */
    public function edit(User $propertyOwner): Response
    {
        $this->authorize('property_owners.edit');
        $propertyOwner->load('profile');

        return Inertia::render('Admin/PropertyOwners/Edit', [
            'propertyOwner' => [
                'id' => $propertyOwner->id,
                'ulid' => $propertyOwner->ulid,
                'name' => $propertyOwner->name,
                'email' => $propertyOwner->email,
                'phone' => $propertyOwner->profile?->phone,
                'unit_number' => $propertyOwner->profile?->unit_number,
                'address' => $propertyOwner->profile?->address,
                'email_verified_at' => $propertyOwner->email_verified_at ? $propertyOwner->email_verified_at->toDateTimeString() : null,
            ],
        ]);
    }

    /**
     * Update the specified property owner.
     */
    public function update(Request $request, User $propertyOwner): RedirectResponse
    {
        $this->authorize('property_owners.edit');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($propertyOwner->id),
                function ($attribute, $value, $fail) use ($propertyOwner) {
                    if ($propertyOwner->email_verified_at && $value !== $propertyOwner->email) {
                        $fail('The email address cannot be changed once the account has been verified.');
                    }
                },
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $propertyOwner->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $propertyOwner->profile()->update([
            'phone' => $validated['phone'] ?? null,
            'unit_number' => $validated['unit_number'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return redirect()
            ->route('admin.property-owners.index')
            ->with('success', 'Property Owner updated successfully.');
    }

    /**
     * Toggle the suspension status of the property owner.
     */
    public function suspend(User $propertyOwner): RedirectResponse
    {
        $this->authorize('property_owners.suspend');

        if ($propertyOwner->suspended_at) {
            $propertyOwner->update(['suspended_at' => null]);
            $message = 'Property Owner reactivated successfully.';
        } else {
            $propertyOwner->update(['suspended_at' => now()]);
            $message = 'Property Owner suspended successfully.';
        }

        return back()->with('success', $message);
    }

    /**
     * View residents managed by the Property Owner.
     */
    public function residents(User $propertyOwner): Response
    {
        $this->authorize('property_owners.view');
        $estate = $this->estateContext->getEstate();

        $residents = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $propertyOwner->id))
            ->forEstate($estate->id)
            ->with(['profile.property', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
            ->orderBy('name')
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'ulid' => $user->ulid,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->profile?->phone,
                'property' => $user->profile?->property?->name,
                'status' => $user->estates->first()?->pivot?->status ?? 'pending',
                'suspended_at' => $user->suspended_at,
            ]);

        return Inertia::render('Admin/PropertyOwners/Residents', [
            'propertyOwner' => [
                'id' => $propertyOwner->id,
                'name' => $propertyOwner->name,
            ],
            'residents' => $residents,
        ]);
    }

    /**
     * Get JSON list of available residents to assign to the Property Owner.
     */
    public function availableResidents(Request $request, User $propertyOwner)
    {
        $this->authorize('property_owners.edit');
        $estate = $this->estateContext->getEstate();
        $search = $request->query('search');

        $residents = User::query()
            ->forEstate($estate->id)
            ->withRole('resident', $estate->id)
            ->whereNotExists(function ($q) use ($estate) {
                $q->select(DB::raw(1))
                    ->from('model_has_roles')
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->whereColumn('model_has_roles.model_id', 'users.id')
                    ->where('model_has_roles.model_type', User::class)
                    ->where('roles.name', 'property_owner')
                    ->where('model_has_roles.estate_id', $estate->id);
            })
            ->where(function ($query) use ($propertyOwner) {
                $query->whereHas('profile', fn ($q) => $q->where('property_owner_id', '!=', $propertyOwner->id)->orWhereNull('property_owner_id'))
                    ->orWhereDoesntHave('profile');
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with('profile.propertyOwner') // Include current property owner info if any
            ->orderBy('name')
            ->limit(20) // Limit results to ensure quick response in modal
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'current_owner' => $user->profile?->propertyOwner?->name,
            ]);

        return response()->json($residents);
    }

    /**
     * Assign selected residents to the Property Owner.
     */
    public function assignResidents(Request $request, User $propertyOwner, AssignResidentsToPropertyOwnerAction $action): RedirectResponse
    {
        $this->authorize('property_owners.edit');

        $validated = $request->validate([
            'resident_ids' => ['required', 'array', 'min:1'],
            'resident_ids.*' => ['required', 'integer', Rule::exists('users', 'id')],
        ]);

        $estate = $this->estateContext->getEstate();

        $action->execute($propertyOwner, $validated['resident_ids'], $estate);

        return back()->with('success', count($validated['resident_ids']).' resident(s) successfully assigned.');
    }

    /**
     * View properties created by the Property Owner.
     */
    public function properties(User $propertyOwner): Response
    {
        $this->authorize('property_owners.view');
        $estate = $this->estateContext->getEstate();

        $properties = Property::query()
            ->where('property_owner_id', $propertyOwner->id)
            ->where('estate_id', $estate->id)
            ->withCount(['residents'])
            ->orderBy('name')
            ->get()
            ->map(fn ($property) => [
                'id' => $property->id,
                'ulid' => $property->ulid,
                'name' => $property->name,
                'residents_count' => $property->residents_count,
                'archived_at' => $property->archived_at,
                'created_at' => $property->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Admin/PropertyOwners/Properties', [
            'propertyOwner' => [
                'id' => $propertyOwner->id,
                'name' => $propertyOwner->name,
            ],
            'properties' => $properties,
        ]);
    }
}
