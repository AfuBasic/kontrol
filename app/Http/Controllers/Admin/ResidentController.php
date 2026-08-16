<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\AssignUsersToZoneAction;
use App\Actions\Admin\BulkDeleteResidentsAction;
use App\Actions\Admin\BulkInviteResidentsAction;
use App\Actions\Admin\CreateResidentAction;
use App\Actions\Admin\DeleteResidentAction;
use App\Actions\Admin\MarkResidentAsPropertyOwnerAction;
use App\Actions\Admin\ResendResidentInvitationAction;
use App\Actions\Admin\SuspendResidentAction;
use App\Actions\Admin\UpdateResidentAction;
use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreResidentRequest;
use App\Models\Activity;
use App\Models\CollectionAssignment;
use App\Models\EstateInviteLink;
use App\Models\Invitation;
use App\Models\Property;
use App\Models\User;
use App\Models\Zone;
use App\Services\Admin\ResidentService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ResidentController extends Controller
{
    public function __construct(
        protected ResidentService $residentService,
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of residents.
     */
    public function index(Request $request): Response
    {
        $this->authorize('residents.view');

        $filters = $request->only(['search', 'status', 'role', 'property', 'zone', 'sort']);
        $estate = $this->estateContext->getEstate();
        $residentRoles = Role::whereIn('name', ['resident', 'household_member'])
            ->whereNull('estate_id')
            ->pluck('id');

        $residents = Inertia::defer(fn () => $this->residentService
            ->getPaginatedResidents(15, $filters)
            ->through(function ($user) use ($estate) {
                $membership = $user->estates->first()?->pivot;
                $zone = $membership?->zone_id ? Zone::find($membership->zone_id) : null;
                $assignment = $user->administrativeAssignments->first();
                $isSuspended = $assignment ? ! $assignment->is_active : false;

                return [
                    'id' => $user->id,
                    'ulid' => $user->ulid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->profile?->phone,
                    'unit_number' => $user->profile?->unit_number,
                    'zone_id' => $membership?->zone_id,
                    'zone_name' => $zone?->name ?? 'Entire Estate',
                    'property_owner_id' => $user->profile?->property_owner_id,
                    'property_owner_name' => $user->profile?->propertyOwner?->name,
                    'property_id' => $user->profile?->property_id,
                    'property_name' => $user->profile?->property?->name,
                    'status' => $isSuspended ? 'inactive' : ($membership?->status ?? 'pending'),
                    'is_property_owner' => $user->roles->contains('name', 'property_owner'),
                    'role_label' => $user->roles->contains('name', 'property_owner')
                        ? 'Property Owner'
                        : ($user->profile?->property_owner_id ? 'Tenant' : 'Resident'),
                    'household_members_count' => $user->household_members_count ?? 0,
                    'suspended_at' => $isSuspended ? ($assignment?->updated_at ?? now()) : null,
                    'email_verified_at' => $user->email_verified_at,
                    'last_active' => $user->updated_at?->diffForHumans() ?? 'Never',
                    'created_at' => $user->created_at->format('M d, Y'),
                    'is_estate_creator' => $user->email === $estate->email,
                ];
            }));

        // Section 1: Overview stats
        $totalResidents = User::query()->forEstate($estate->id)->topLevelResident($estate->id)->count();
        $activeResidents = User::query()->forEstate($estate->id)
            ->topLevelResident($estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles)->where('is_active', true))
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'accepted'))
            ->count();
        $pendingMembership = User::query()
            ->forEstate($estate->id)
            ->topLevelResident($estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles)->where('is_active', true))
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'));

        $unacceptedInvitations = (clone $pendingMembership)->whereNull('email_verified_at')->count();
        $awaitingApproval = (clone $pendingMembership)->whereNotNull('email_verified_at')->count();
        $pendingAccess = $unacceptedInvitations + $awaitingApproval;
        $inactiveResidents = User::query()->forEstate($estate->id)
            ->topLevelResident($estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->whereIn('role_id', $residentRoles)->where('is_active', false))
            ->count();

        $totalProperties = Property::where('estate_id', $estate->id)->whereNull('archived_at')->count();
        $occupiedProperties = Property::where('estate_id', $estate->id)->whereNull('archived_at')->whereHas('residents')->count();
        $occupancyRate = $totalProperties > 0 ? (int) round(($occupiedProperties / $totalProperties) * 100) : 0;

        // Section 3: Invitation management link
        $inviteLinks = $estate->inviteLinks()->with('zone')->get();
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

        return Inertia::render('Admin/Residents/Index', [
            'residents' => $residents,
            'filters' => $filters,
            'zones' => $this->zonesForAssignment($estate->id, app(ContextManager::class)->current()),
            'stats' => [
                'total' => $totalResidents,
                'active' => $activeResidents,
                'pending' => $pendingAccess,
                'inactive' => $inactiveResidents,
                'occupancy_rate' => $occupancyRate,
            ],
            // Heavier insight queries load after first paint
            'insights' => Inertia::defer(function () use ($estate, $unacceptedInvitations, $awaitingApproval, $totalProperties, $occupiedProperties) {
                $insights = [];
                if ($awaitingApproval > 0) {
                    $insights[] = $awaitingApproval === 1
                        ? '1 resident is awaiting admin approval.'
                        : "{$awaitingApproval} residents are awaiting admin approval.";
                }
                if ($unacceptedInvitations > 0) {
                    $insights[] = $unacceptedInvitations === 1
                        ? '1 resident has not accepted their invitation.'
                        : "{$unacceptedInvitations} residents have not accepted their invitations.";
                }
                $vacantUnits = $totalProperties - $occupiedProperties;
                if ($vacantUnits > 0) {
                    $insights[] = "{$vacantUnits} units are currently vacant.";
                }
                $joinedThisMonth = User::query()
                    ->forEstate($estate->id)
                    ->topLevelResident($estate->id)
                    ->where('users.created_at', '>=', now()->startOfMonth())
                    ->count();
                if ($joinedThisMonth > 0) {
                    $insights[] = "{$joinedThisMonth} residents joined this month.";
                }
                $profileIncomplete = User::query()
                    ->forEstate($estate->id)
                    ->topLevelResident($estate->id)
                    ->where(function ($query) {
                        $query->whereHas('profile', fn ($q) => $q->whereNull('phone')->orWhereNull('unit_number'))
                            ->orWhereDoesntHave('profile');
                    })
                    ->count();
                if ($profileIncomplete > 0) {
                    $insights[] = "{$profileIncomplete} residents require profile completion.";
                }

                return $insights;
            }),
            'incompleteResidents' => Inertia::defer(fn () => User::query()
                ->forEstate($estate->id)
                ->topLevelResident($estate->id)
                ->where(function ($query) {
                    $query->whereHas('profile', fn ($q) => $q->whereNull('phone')->orWhereNull('unit_number'))
                        ->orWhereDoesntHave('profile');
                })
                ->get(['users.id', 'users.name'])
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
                ->toArray()),
            'inviteLinks' => $inviteLinksData,
        ]);
    }

    /**
     * Show the form for creating a new resident.
     */
    public function create(): Response
    {
        $this->authorize('residents.create');
        $estate = $this->estateContext->getEstate();
        $inviteLinks = $estate->inviteLinks()->with('zone')->get();

        return Inertia::render('Admin/Residents/Create', [
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
            'propertyOwners' => User::query()
                ->forEstate($estate->id)
                ->withRole('property_owner', $estate->id)
                ->active()
                ->orderBy('name')
                ->get(['users.id', 'users.name'])
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
            'zones' => Zone::query()
                ->where('estate_id', $estate->id)
                ->where('is_active', true)
                ->when(app(ContextManager::class)->current()?->isZoneScoped(), function ($q) {
                    $q->where('id', app(ContextManager::class)->current()->zoneId);
                })
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
        abort_if(! app(ContextManager::class)->current()?->canAccess($resident), 403, 'Unauthorized zone scope.');
        $resident->load(['profile.propertyOwner', 'profile.property']);
        $estate = $this->estateContext->getEstate();
        $context = app(ContextManager::class)->current();
        $membership = $resident->estates()->where('estates.id', $estate->id)->first()?->pivot;

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
                'zone_id' => $membership?->zone_id,
                'is_estate_creator' => $resident->email === $estate->email,
            ],
            'zones' => $this->zonesForAssignment($estate->id, $context),
            'propertyOwners' => User::query()
                ->forEstate($estate->id)
                ->withRole('property_owner', $estate->id)
                ->active()
                ->orderBy('name')
                ->get(['users.id', 'users.name'])
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
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
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($resident), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users')->ignore($resident->id),
                function ($attribute, $value, $fail) use ($resident) {
                    if ($value !== $resident->email) {
                        $cacheKey = "email_changes_{$resident->id}";
                        $changesCount = Cache::get($cacheKey, 0);
                        if ($changesCount >= 3) {
                            $fail('The email address can only be changed 3 times within a year.');
                        }
                    }
                },
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'property_owner_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'property_id' => [
                'nullable',
                'integer',
                Rule::exists('properties', 'id'),
                function ($attribute, $value, $fail) use ($context) {
                    if ($context && $context->isZoneScoped()) {
                        $property = Property::withoutZoneIsolation()->find($value);
                        if ($property && $property->zone_id !== $context->zoneId) {
                            $fail('The selected property must belong to your authorized zone.');
                        }
                    }
                },
            ],
            'zone_id' => $this->zoneAssignmentRules($estate->id, $context),
        ]);
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
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($resident), 403, 'Unauthorized zone scope.');
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
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($resident), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        $action->execute($resident, $estate);

        $message = $resident->suspended_at
            ? 'Resident suspended successfully.'
            : 'Resident activated successfully.';

        return back()->with('success', $message);
    }

    /**
     * Mark the specified resident as a property owner.
     */
    public function markAsPropertyOwner(User $resident, MarkResidentAsPropertyOwnerAction $action): RedirectResponse
    {
        $this->authorize('property_owners.create');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($resident), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        $action->execute($resident, $estate);

        return back()->with('success', 'Resident successfully marked as a Property Owner.');
    }

    /**
     * Resend invitation for the specified resident.
     */
    public function resendInvitation(User $resident, ResendResidentInvitationAction $action): RedirectResponse
    {
        $this->authorize('residents.reset-password');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($resident), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        if ($resident->email_verified_at !== null) {
            return back()->with('error', 'Cannot resend invitation. This resident has already accepted.');
        }

        $action->execute($resident, $estate);

        return back()->with('success', 'Invitation resent successfully.');
    }

    /**
     * Bulk invite residents by email.
     */
    public function bulkInvite(Request $request, BulkInviteResidentsAction $action): RedirectResponse
    {
        $this->authorize('residents.create');
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'emails' => ['required', 'array', 'min:1', 'max:500'],
            'emails.*' => ['required', 'email'],
            'zone_id' => [
                'nullable',
                'integer',
                Rule::exists('zones', 'id')->where('estate_id', app(EstateContextService::class)->getEstate()->id),
                function ($attribute, $value, $fail) use ($context) {
                    if ($context && $context->isZoneScoped() && $value !== $context->zoneId) {
                        $fail('You are only authorized to invite residents to your active zone.');
                    }
                },
            ],
        ]);

        $zoneId = $validated['zone_id'] ?? null;
        if ($context && $context->isZoneScoped()) {
            $zoneId = $context->zoneId;
        }

        $estate = $this->estateContext->getEstate();
        $result = $action->execute($validated['emails'], $estate, $zoneId);

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
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'ids' => ['required_if:all,false', 'array'],
            'all' => ['sometimes', 'boolean'],
            'filters' => ['sometimes', 'array'],
        ]);

        $estate = $this->estateContext->getEstate();
        $ids = $validated['ids'] ?? [];

        if ($request->boolean('all')) {
            $query = User::query()
                ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id));

            if ($request->filled('filters.search')) {
                $search = $request->input('filters.search');
                $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"));
            }

            if ($request->filled('filters.status')) {
                $status = $request->input('filters.status');
                $query->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)
                    ->where('estate_users_membership.status', $status));
            }

            $ids = $query->pluck('users.id')->toArray();
        }

        if ($context && $context->isZoneScoped()) {
            $unauthorized = User::whereIn('id', $ids)
                ->whereDoesntHave('estates', function ($q) use ($context) {
                    $q->where('estates.id', $context->estateId)
                        ->where('estate_users_membership.zone_id', $context->zoneId);
                })
                ->exists();
            abort_if($unauthorized, 403, 'One or more selected residents are outside your authorized zone.');
        }

        $result = $action->execute($ids, $estate);

        $total = $result['deleted'] + $result['detached'];

        return redirect()
            ->route('admin.residents.index')
            ->with('success', "Successfully removed {$total} resident(s).");
    }

    public function bulkSuspend(Request $request, SuspendResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.suspend');
        $estate = $this->estateContext->getEstate();
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'ids' => ['required', 'array'],
        ]);

        if ($context && $context->isZoneScoped()) {
            $unauthorized = User::whereIn('id', $validated['ids'])
                ->whereDoesntHave('estates', function ($q) use ($context) {
                    $q->where('estates.id', $context->estateId)
                        ->where('estate_users_membership.zone_id', $context->zoneId);
                })
                ->exists();
            abort_if($unauthorized, 403, 'One or more selected residents are outside your authorized zone.');
        }

        $residents = User::query()->whereIn('id', $validated['ids'])->get();
        foreach ($residents as $resident) {
            if (! $resident->suspended_at) {
                $action->execute($resident, $estate);
            }
        }

        return back()->with('success', 'Selected resident(s) suspended successfully.');
    }

    public function bulkActivate(Request $request, SuspendResidentAction $action): RedirectResponse
    {
        $this->authorize('residents.suspend');
        $estate = $this->estateContext->getEstate();
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'ids' => ['required', 'array'],
        ]);

        if ($context && $context->isZoneScoped()) {
            $unauthorized = User::whereIn('id', $validated['ids'])
                ->whereDoesntHave('estates', function ($q) use ($context) {
                    $q->where('estates.id', $context->estateId)
                        ->where('estate_users_membership.zone_id', $context->zoneId);
                })
                ->exists();
            abort_if($unauthorized, 403, 'One or more selected residents are outside your authorized zone.');
        }

        $residents = User::query()->whereIn('id', $validated['ids'])->get();
        foreach ($residents as $resident) {
            if ($resident->suspended_at) {
                $action->execute($resident, $estate);
            }
        }

        return back()->with('success', 'Selected resident(s) activated successfully.');
    }

    public function bulkResendInvitation(Request $request, ResendResidentInvitationAction $action): RedirectResponse
    {
        $this->authorize('residents.reset-password');
        $estate = $this->estateContext->getEstate();
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'ids' => ['required', 'array'],
        ]);

        if ($context && $context->isZoneScoped()) {
            $unauthorized = User::whereIn('id', $validated['ids'])
                ->whereDoesntHave('estates', function ($q) use ($context) {
                    $q->where('estates.id', $context->estateId)
                        ->where('estate_users_membership.zone_id', $context->zoneId);
                })
                ->exists();
            abort_if($unauthorized, 403, 'One or more selected residents are outside your authorized zone.');
        }

        $residents = User::query()->whereIn('id', $validated['ids'])->get();
        foreach ($residents as $resident) {
            if (! $resident->password) {
                $action->execute($resident, $estate);
            }
        }

        return back()->with('success', 'Invitations resent successfully.');
    }

    public function bulkAssignZone(Request $request, AssignUsersToZoneAction $action): RedirectResponse
    {
        $this->authorize('residents.edit');
        $estate = $this->estateContext->getEstate();
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
            'zone_id' => $this->zoneAssignmentRules($estate->id, $context),
        ]);

        if ($context && $context->isZoneScoped()) {
            $unauthorized = User::whereIn('id', $validated['ids'])
                ->whereDoesntHave('estates', function ($q) use ($context) {
                    $q->where('estates.id', $context->estateId)
                        ->where('estate_users_membership.zone_id', $context->zoneId);
                })
                ->exists();
            abort_if($unauthorized, 403, 'One or more selected residents are outside your authorized zone.');
        }

        $zoneId = $validated['zone_id'] ?? null;
        if ($context && $context->isZoneScoped()) {
            $zoneId = $context->zoneId;
        }

        $updated = $action->execute($validated['ids'], $estate, $zoneId !== null ? (int) $zoneId : null);

        return back()->with('success', $updated === 1
            ? 'Resident moved to the selected zone.'
            : "{$updated} residents moved to the selected zone.");
    }

    /**
     * Display the specified resident's profile.
     */
    public function show(User $resident): Response
    {
        $this->authorize('residents.view');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($resident), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        // Scope validation: Ensure resident belongs to this estate
        $membership = $resident->estates()
            ->where('estates.id', $estate->id)
            ->first()
            ?->pivot;

        abort_if(! $membership, 404, 'Resident does not belong to this estate.');

        // Load profile and related properties
        $resident->load([
            'profile.property.zone', 
            'profile.propertyOwner', 
            'roles',
            'householdMembers' => fn($q) => $q->where('estate_id', $estate->id)->with('member.profile'),
            'householdOf' => fn($q) => $q->where('estate_id', $estate->id)->with('primaryResident.profile'),
        ]);

        // Count other residents at the same property
        $residentsCount = 0;
        $propertyId = $resident->profile?->property_id;
        if ($propertyId) {
            $residentsCount = User::query()
                ->whereHas('profile', fn ($q) => $q->where('property_id', $propertyId))
                ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
                ->count();
        }

        // Fetch collection assignments (direct & property owner's if applicable)
        $personalAssignments = CollectionAssignment::query()
            ->where('user_id', $resident->id)
            ->whereHas('collection', fn ($q) => $q->where('estate_id', $estate->id))
            ->with('collection')
            ->get();

        $totalPaid = $personalAssignments->sum('amount_paid');
        $totalOutstanding = $personalAssignments->sum(fn ($a) => $a->amount_due - $a->amount_paid);

        $recentPayments = $personalAssignments->where('amount_paid', '>', 0)
            ->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->collection->name,
                'amount' => $a->amount_paid,
                'status' => $a->status,
                'date' => $a->updated_at->format('d M Y, h:i A'),
            ])
            ->sortByDesc('date')
            ->take(5)
            ->values();

        $poAssignments = collect();
        $propertyOwner = $resident->profile?->propertyOwner;
        if ($propertyOwner) {
            $poAssignments = CollectionAssignment::query()
                ->where('user_id', $propertyOwner->id)
                ->whereHas('collection', fn ($q) => $q->where('estate_id', $estate->id))
                ->with('collection')
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->collection->name,
                    'amount_due' => $a->amount_due,
                    'amount_paid' => $a->amount_paid,
                    'outstanding' => $a->amount_due - $a->amount_paid,
                    'status' => $a->status,
                ]);
        }

        // Fetch Spatie Activity log events for this resident
        $activities = Activity::query()
            ->where('subject_type', User::class)
            ->where('subject_id', $resident->id)
            ->where('estate_id', $estate->id)
            ->with('causer')
            ->latest()
            ->get()
            ->map(fn ($act) => [
                'id' => $act->id,
                'description' => $act->description,
                'causer_name' => $act->causer?->name ?? 'System',
                'created_at' => $act->created_at->format('M d, Y · h:i A'),
            ]);

        // Load specific details for the registration avenue
        $initiatorName = null;
        if ($membership->initiated_by) {
            $initiatorName = User::find($membership->initiated_by)?->name;
        }

        $lastInvitedByName = null;
        if ($membership->last_invited_by) {
            $lastInvitedByName = User::find($membership->last_invited_by)?->name;
        }

        $inviteLinkUrl = null;
        if ($membership->invitation_link_id) {
            $link = EstateInviteLink::find($membership->invitation_link_id);
            if ($link) {
                $inviteLinkUrl = url("/join/{$link->token}");
            }
        }

        $invitation = null;
        if ($membership->invitation_id) {
            $invitationModel = Invitation::withoutGlobalScopes()
                ->find($membership->invitation_id);
            if ($invitationModel) {
                $invitation = [
                    'id' => $invitationModel->id,
                    'token' => $invitationModel->token,
                    'created_at' => $invitationModel->created_at?->format('d M Y, h:i A'),
                    'accepted_at' => $invitationModel->accepted_at?->format('d M Y, h:i A'),
                ];
            }
        }

        // Human readable registration source
        $avenue = match ($membership->created_via) {
            'single_form' => 'Single resident',
            'bulk_upload' => 'Bulk upload',
            'email_paste' => 'Email import',
            'invite_link' => 'Invitation link',
            'property_owner_invite' => 'Property owner',
            'system' => 'Unknown / Legacy',
            default => 'Unknown / Legacy',
        };

        // Determine if account is suspended / active
        $assignment = $resident->administrativeAssignments()
            ->where('estate_id', $estate->id)
            ->first();
        $isActive = $assignment ? $assignment->is_active : true;

        $household = collect();

        foreach ($resident->householdMembers as $hm) {
            if ($hm->member) {
                $household->push([
                    'id' => $hm->member->id,
                    'name' => $hm->member->name,
                    'type' => 'Dependent',
                    'is_primary' => false,
                ]);
            }
        }

        if ($resident->householdOf && $resident->householdOf->primaryResident) {
            $household->push([
                'id' => $resident->householdOf->primaryResident->id,
                'name' => $resident->householdOf->primaryResident->name,
                'type' => 'Primary Resident',
                'is_primary' => true,
            ]);
        }

        return Inertia::render('Admin/Residents/Show', [
            'resident' => [
                'id' => $resident->id,
                'ulid' => $resident->ulid,
                'name' => $resident->name,
                'email' => $resident->email,
                'phone' => $resident->profile?->phone,
                'unit_number' => $resident->profile?->unit_number,
                'address' => $resident->profile?->address,
                'property_id' => $resident->profile?->property_id,
                'property_name' => $resident->profile?->property?->name,
                'is_active' => $isActive,
                'email_verified_at' => $resident->email_verified_at?->format('d M Y, h:i A'),
                'is_verified' => $resident->email_verified_at !== null,
                'has_password' => $resident->password !== null,
                'can_resend_invitation' => $resident->email_verified_at === null,
                'role_label' => $resident->roles->contains('name', 'property_owner')
                    ? 'Property Owner'
                    : ($resident->roles->contains('name', 'security')
                        ? 'Security Personnel'
                        : ($resident->roles->contains('name', 'admin')
                            ? 'Administrator'
                            : ($resident->profile?->property_owner_id ? 'Tenant' : ($resident->roles->isNotEmpty() ? Str::title(str_replace('_', ' ', $resident->roles->first()->name)) : 'Resident')))),
            ],
            'provenance' => [
                'created_via' => $membership->created_via,
                'avenue' => $avenue,
                'initiated_by_name' => $initiatorName,
                'initiated_at' => $membership->initiated_at?->format('d M Y, h:i A') ?? $membership->created_at?->format('d M Y, h:i A'),
                'last_invited_by_name' => $lastInvitedByName,
                'last_invited_at' => $membership->last_invited_at?->format('d M Y, h:i A'),
                'accepted_at' => $membership->accepted_at?->format('d M Y, h:i A'),
                'import_batch' => $membership->import_batch,
                'invite_link_url' => $inviteLinkUrl,
                'invitation' => $invitation,
            ],
            'residence' => [
                'property_owner_name' => $propertyOwner?->name,
                'property_owner_id' => $propertyOwner?->id,
                'zone_name' => $resident->profile?->property?->zone?->name ?? 'Entire Estate',
                'residents_count' => $residentsCount,
            ],
            'financials' => [
                'total_paid' => $totalPaid,
                'total_outstanding' => $totalOutstanding,
                'recent_payments' => $recentPayments,
                'property_owner_financials' => $poAssignments,
            ],
            'activities' => $activities,
            'household' => $household,
        ]);
    }

    /**
     * @return array<int, mixed>
     */
    private function zoneAssignmentRules(int $estateId, mixed $context): array
    {
        return [
            $context?->isZoneScoped() ? 'required' : 'nullable',
            'integer',
            Rule::exists('zones', 'id')->where('estate_id', $estateId),
            function ($attribute, $value, $fail) use ($context) {
                if ($context && $context->isZoneScoped() && (int) $value !== $context->zoneId) {
                    $fail('You are only authorized to assign residents to your active zone.');
                }
            },
        ];
    }

    /**
     * @return Collection<int, Zone>
     */
    private function zonesForAssignment(int $estateId, mixed $context)
    {
        return Zone::query()
            ->where('estate_id', $estateId)
            ->when($context?->isZoneScoped(), fn ($q) => $q->where('id', $context->zoneId))
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
