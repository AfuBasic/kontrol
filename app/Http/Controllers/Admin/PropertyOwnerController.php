<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\AssignResidentsToPropertyOwnerAction;
use App\Actions\Admin\BulkDeletePropertyOwnersAction;
use App\Actions\Admin\BulkInvitePropertyOwnersAction;
use App\Actions\Admin\CreatePropertyOwnerAction;
use App\Actions\Admin\DeletePropertyOwnerAction;
use App\Actions\Admin\ResendResidentInvitationAction;
use App\Actions\Admin\SuspendPropertyOwnerAction;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Http\Controllers\Controller;
use App\Models\AdministrativeAssignment;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use App\Services\EstateContextService;
use App\Services\ResidentSubscriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

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

        $filters = $request->only(['search', 'status', 'property', 'sort']);
        $estate = $this->estateContext->getEstate();
        $poRole = Role::where('name', 'property_owner')->whereNull('estate_id')->first();

        $query = User::query()
            ->forEstate($estate->id)
            ->withRole('property_owner', $estate->id)
            ->with([
                'roles',
                'profile',
                'estates' => fn ($q) => $q->where('estates.id', $estate->id),
                'administrativeAssignments' => fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id)),
            ])
            ->withCount([
                'properties' => fn ($q) => $q->where('estate_id', $estate->id),
                'managedResidents',
            ])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('profile', function ($pq) use ($search) {
                            $pq->where('phone', 'like', "%{$search}%")
                                ->orWhere('unit_number', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) use ($estate, $poRole) {
                if ($status === 'active') {
                    $query->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id))->where('is_active', true))
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'accepted'));
                } elseif ($status === 'inactive') {
                    $query->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id))->where('is_active', false));
                } elseif ($status === 'invited') {
                    $query->whereNull('password')
                        ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id))->where('is_active', true))
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));
                } elseif ($status === 'pending_activation') {
                    $query->whereNotNull('password')
                        ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id))->where('is_active', true))
                        ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));
                }
            })
            ->when($filters['property'] ?? null, function ($query, $property) use ($estate) {
                if ($property === 'has_properties') {
                    $query->whereHas('properties', fn ($q) => $q->where('estate_id', $estate->id));
                } elseif ($property === 'no_properties') {
                    $query->whereDoesntHave('properties', fn ($q) => $q->where('estate_id', $estate->id));
                }
            })
            ->when($filters['sort'] ?? null, function ($query, $sort) {
                if ($sort === 'name') {
                    $query->orderBy('name', 'asc');
                } elseif ($sort === 'date_joined') {
                    $query->orderBy('created_at', 'desc');
                } elseif ($sort === 'properties_owned') {
                    $query->orderBy('properties_count', 'desc');
                }
            }, function ($query) {
                $query->latest();
            });

        $propertyOwners = $query->paginate(15)
            ->through(function ($user) {
                $assignment = $user->administrativeAssignments->first();
                $isSuspended = $assignment ? ! $assignment->is_active : false;

                return [
                    'id' => $user->id,
                    'ulid' => $user->ulid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->profile?->phone,
                    'unit_number' => $user->profile?->unit_number,
                    'status' => $isSuspended ? 'inactive' : ($user->estates->first()?->pivot?->status ?? 'pending'),
                    'suspended_at' => $isSuspended ? ($assignment?->updated_at ?? now()) : null,
                    'email_verified_at' => $user->email_verified_at,
                    'properties_count' => $user->properties_count,
                    'residents_count' => $user->managed_residents_count,
                    'is_resident' => $user->roles->contains('name', 'resident'),
                    'created_at' => $user->created_at->format('M d, Y'),
                ];
            })
            ->withQueryString();

        // Section 1: Metrics Strip
        $totalOwners = User::query()->forEstate($estate->id)->withRole('property_owner', $estate->id)->count();
        $activeOwners = User::query()->forEstate($estate->id)->withRole('property_owner', $estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id))->where('is_active', true))
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'accepted'))
            ->count();
        $pendingOwners = User::query()->forEstate($estate->id)->withRole('property_owner', $estate->id)->whereNull('password')
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id))->where('is_active', true))
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'))
            ->count();
        $inactiveOwners = User::query()->forEstate($estate->id)->withRole('property_owner', $estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($poRole, fn ($sq) => $sq->where('role_id', $poRole->id))->where('is_active', false))
            ->count();
        $totalPropertiesOwned = Property::where('estate_id', $estate->id)->whereNull('archived_at')->whereNotNull('property_owner_id')->count();

        // Section 2: Insights Box
        $insights = [];
        if ($pendingOwners > 0) {
            $insights[] = "{$pendingOwners} property owners have not accepted their invitations.";
        }
        $ownersNoPropertiesList = User::query()
            ->forEstate($estate->id)
            ->withRole('property_owner', $estate->id)
            ->whereDoesntHave('properties', fn ($q) => $q->where('estate_id', $estate->id))
            ->get(['users.id', 'users.name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
            ->toArray();

        $ownersWithNoProperties = count($ownersNoPropertiesList);
        if ($ownersWithNoProperties > 0) {
            $insights[] = "{$ownersWithNoProperties} property owners have no properties assigned to them.";
        }
        $joinedThisMonth = User::query()->forEstate($estate->id)->withRole('property_owner', $estate->id)->where('users.created_at', '>=', now()->startOfMonth())->count();
        if ($joinedThisMonth > 0) {
            $insights[] = "{$joinedThisMonth} property owners joined this month.";
        }

        // Section 3: Invitation Link management
        $inviteLinks = $estate->propertyOwnerInviteLinks()->with('zone')->get();
        $inviteLinksData = $inviteLinks->map(fn ($link) => [
            'id' => $link->id,
            'token' => $link->token,
            'url' => url("/join/{$link->token}"),
            'is_active' => $link->is_active,
            'usage_count' => $link->usage_count,
            'max_usages' => $link->max_usages,
            'requires_approval' => $link->requires_approval,
            'expires_at' => $link->expires_at?->toDateTimeString(),
            'is_expired' => $link->expires_at?->isPast() ?? false,
            'zone_id' => $link->zone_id,
            'zone_name' => $link->zone?->name ?? 'Entire Estate',
        ])->toArray();

        return Inertia::render('Admin/PropertyOwners/Index', [
            'propertyOwners' => $propertyOwners,
            'filters' => $filters,
            'stats' => [
                'total' => $totalOwners,
                'active' => $activeOwners,
                'pending' => $pendingOwners,
                'inactive' => $inactiveOwners,
                'properties_owned' => $totalPropertiesOwned,
            ],
            'insights' => $insights,
            'incompleteOwners' => $ownersNoPropertiesList,
            'inviteLinks' => $inviteLinksData,
        ]);
    }

    /**
     * Show the form for creating a new property owner.
     */
    public function create(): Response
    {
        $this->authorize('property_owners.create');
        $estate = $this->estateContext->getEstate();
        $inviteLinks = $estate->propertyOwnerInviteLinks()->with('zone')->get();

        return Inertia::render('Admin/PropertyOwners/Create', [
            'inviteLinks' => $inviteLinks->map(fn ($link) => [
                'id' => $link->id,
                'token' => $link->token,
                'url' => url("/join/{$link->token}"),
                'is_active' => $link->is_active,
                'usage_count' => $link->usage_count,
                'max_usages' => $link->max_usages,
                'requires_approval' => $link->requires_approval,
                'expires_at' => $link->expires_at?->toDateTimeString(),
                'is_expired' => $link->expires_at?->isPast() ?? false,
                'zone_id' => $link->zone_id,
                'zone_name' => $link->zone?->name ?? 'Entire Estate',
            ])->toArray(),
            'zones' => Zone::query()
                ->where('estate_id', $estate->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
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
            'zone_id' => ['nullable', 'integer', Rule::exists('zones', 'id')->where('estate_id', app(EstateContextService::class)->getEstate()->id)],
        ]);

        $estate = $this->estateContext->getEstate();
        $result = $action->execute($validated['emails'], $estate, $validated['zone_id'] ?? null);

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
            'zone_id' => ['nullable', 'integer', Rule::exists('zones', 'id')->where('estate_id', app(EstateContextService::class)->getEstate()->id)],
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
    public function suspend(User $propertyOwner, SuspendPropertyOwnerAction $action): RedirectResponse
    {
        $this->authorize('property_owners.suspend');
        $estate = $this->estateContext->getEstate();

        $isActive = $action->execute($propertyOwner, $estate);
        $message = $isActive
            ? 'Property Owner reactivated successfully.'
            : 'Property Owner suspended successfully.';

        return back()->with('success', $message);
    }

    /**
     * View residents managed by the Property Owner.
     */
    public function residents(Request $request, User $propertyOwner): Response
    {
        $this->authorize('property_owners.view');
        $estate = $this->estateContext->getEstate();

        return Inertia::render('Admin/PropertyOwners/Residents', [
            'propertyOwner' => [
                'id' => $propertyOwner->id,
                'name' => $propertyOwner->name,
            ],
            'residents' => Inertia::defer(fn () => User::query()
                ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.property_owner_id', $propertyOwner->id))
                ->forEstate($estate->id)
                ->with(['profile.property', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
                ->orderBy('name')
                ->get()
                ->map(fn ($resident) => [
                    'id' => $resident->id,
                    'ulid' => $resident->ulid,
                    'name' => $resident->name,
                    'email' => $resident->email,
                    'phone' => $resident->profile?->phone,
                    'property' => $resident->profile?->property?->name,
                    'status' => $resident->estates->first()?->pivot?->status ?? 'pending',
                    'suspended_at' => $resident->suspended_at,
                ])),
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
            ->where(function ($query) use ($propertyOwner, $estate) {
                $query->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.property_owner_id', '!=', $propertyOwner->id)->orWhereNull('estate_users_membership.property_owner_id'))
                    ->orWhereDoesntHave('estates', fn ($q) => $q->where('estates.id', $estate->id));
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with(['estates' => fn ($q) => $q->where('estates.id', $estate->id)])
            ->orderBy('name')
            ->limit(20)
            ->get()
            ->map(fn ($resident) => [
                'id' => $resident->id,
                'name' => $resident->name,
                'email' => $resident->email,
                'current_owner' => $resident->estateMembershipFor($estate)?->property_owner_id
                    ? User::find($resident->estateMembershipFor($estate)->property_owner_id)?->name
                    : null,
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

        return Inertia::render('Admin/PropertyOwners/Properties', [
            'propertyOwner' => [
                'id' => $propertyOwner->id,
                'name' => $propertyOwner->name,
            ],
            'properties' => Inertia::defer(fn () => Property::query()
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
                ])),
        ]);
    }

    /**
     * Grant the specified property owner resident privileges.
     */
    public function makeResident(User $propertyOwner): RedirectResponse
    {
        $this->authorize('property_owners.edit');

        $estate = $this->estateContext->getEstate();

        $residentRole = Role::where('name', 'resident')
            ->where('guard_name', 'web')
            ->whereNull('estate_id')
            ->firstOrFail();

        $hasResidentRole = AdministrativeAssignment::where('user_id', $propertyOwner->id)
            ->where('estate_id', $estate->id)
            ->where('is_active', true)
            ->where('role_id', $residentRole->id)
            ->exists();

        if (! $hasResidentRole) {
            AdministrativeAssignment::create([
                'user_id' => $propertyOwner->id,
                'estate_id' => $estate->id,
                'role_id' => $residentRole->id,
                'scope_type' => AssignmentScope::Estate,
                'is_primary' => false,
                'is_active' => true,
            ]);

            app(ContextManager::class)->setSystemContext($estate->id);
            if (! $propertyOwner->hasRole('resident')) {
                $propertyOwner->assignRole($residentRole);
            }

            app(ResidentSubscriptionService::class)->createForUser($propertyOwner, $estate);

            return back()->with('success', 'Property Owner has been successfully granted Resident privileges.');
        }

        return back()->with('info', 'Property Owner is already a Resident.');
    }

    public function destroy(User $propertyOwner, DeletePropertyOwnerAction $action): RedirectResponse
    {
        $this->authorize('property_owners.delete');
        $estate = $this->estateContext->getEstate();

        $action->execute($propertyOwner, $estate);

        return redirect()
            ->route('admin.property-owners.index')
            ->with('success', 'Property Owner removed successfully.');
    }

    public function bulkDelete(Request $request, BulkDeletePropertyOwnersAction $action): RedirectResponse
    {
        $this->authorize('property_owners.delete');
        $estate = $this->estateContext->getEstate();

        $validated = $request->validate([
            'ids' => ['required', 'array'],
        ]);

        $total = $action->execute($validated['ids'], $estate);

        return redirect()
            ->route('admin.property-owners.index')
            ->with('success', "Successfully removed {$total} property owner(s).");
    }

    public function bulkSuspend(Request $request, SuspendPropertyOwnerAction $action): RedirectResponse
    {
        $this->authorize('property_owners.suspend');
        $estate = $this->estateContext->getEstate();

        $validated = $request->validate([
            'ids' => ['required', 'array'],
        ]);

        $residents = User::query()->whereIn('id', $validated['ids'])->get();
        foreach ($residents as $resident) {
            $action->execute($resident, $estate, false);
        }

        return back()->with('success', 'Selected property owner(s) suspended successfully.');
    }

    public function bulkActivate(Request $request, SuspendPropertyOwnerAction $action): RedirectResponse
    {
        $this->authorize('property_owners.suspend');
        $estate = $this->estateContext->getEstate();

        $validated = $request->validate([
            'ids' => ['required', 'array'],
        ]);

        $residents = User::query()->whereIn('id', $validated['ids'])->get();
        foreach ($residents as $resident) {
            $action->execute($resident, $estate, true);
        }

        return back()->with('success', 'Selected property owner(s) activated successfully.');
    }

    public function bulkResendInvitation(Request $request, ResendResidentInvitationAction $action): RedirectResponse
    {
        $this->authorize('property_owners.reset-password');
        $estate = $this->estateContext->getEstate();

        $validated = $request->validate([
            'ids' => ['required', 'array'],
        ]);

        $residents = User::query()->whereIn('id', $validated['ids'])->get();
        foreach ($residents as $resident) {
            if (! $resident->password) {
                $action->execute($resident, $estate);
            }
        }

        return back()->with('success', 'Invitations resent successfully.');
    }
}
