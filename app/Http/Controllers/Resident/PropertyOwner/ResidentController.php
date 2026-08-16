<?php

namespace App\Http\Controllers\Resident\PropertyOwner;

use App\Actions\Admin\ResendResidentInvitationAction;
use App\Actions\Invitation\CreateInvitationAction;
use App\Auth\ContextManager;
use App\Events\Admin\ResidentCreated;
use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\EstateInviteLink;
use App\Models\Property;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ResidentController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a list of managed residents.
     */
    public function index(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $totalUnfiltered = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id))
            ->forEstate($estate->id)
            ->count();

        $query = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id))
            ->forEstate($estate->id)
            ->with(['profile.property', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
            ->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('status')) {
            $query->whereHas('estates', function ($q) use ($estate, $request) {
                $q->where('estates.id', $estate->id)
                    ->where('estate_users_membership.status', $request->status);
            });
        }

        $paginated = $query->paginate(10);

        $residentsData = collect($paginated->items())->map(function ($u) use ($user) {
            // Calculate outstanding balance for collections created by this Property Owner
            $outstandingBalance = CollectionAssignment::query()
                ->where('user_id', $u->id)
                ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
                ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
                ->get()
                ->sum(fn ($assignment) => $assignment->amount_due - $assignment->amount_paid);

            return [
                'id' => $u->id,
                'ulid' => $u->ulid,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->profile?->phone,
                'unit_number' => $u->profile?->unit_number,
                'property' => $u->profile?->property?->name,
                'property_id' => $u->profile?->property_id,
                'outstanding_balance' => $outstandingBalance,
                'status' => $u->estates->first()?->pivot?->status ?? 'pending',
                'suspended_at' => $u->suspended_at,
                'is_active' => $u->suspended_at === null,
            ];
        });

        $residents = [
            'data' => $residentsData,
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'links' => $paginated->linkCollection()->toArray(),
        ];

        return Inertia::render('Resident/PropertyOwner/Residents/Index', [
            'residents' => $residents,
            'totalUnfiltered' => $totalUnfiltered,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
            ],
        ]);
    }

    /**
     * Show form for editing a resident.
     */
    public function edit(User $resident): Response
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        // Ensure this resident is managed by the Property Owner
        abort_if($resident->profile?->property_owner_id !== $user->id, 403);

        $properties = Property::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Resident/PropertyOwner/Residents/Edit', [
            'resident' => [
                'id' => $resident->id,
                'ulid' => $resident->ulid,
                'name' => $resident->name,
                'email' => $resident->email,
                'phone' => $resident->profile?->phone,
                'unit_number' => $resident->profile?->unit_number,
                'address' => $resident->profile?->address,
                'property_id' => $resident->profile?->property_id,
            ],
            'properties' => $properties,
        ]);
    }

    /**
     * Update details of managed resident.
     */
    public function update(Request $request, User $resident): RedirectResponse
    {
        $user = auth()->user();

        // Ensure this resident is managed by the Property Owner
        abort_if($resident->profile?->property_owner_id !== $user->id, 403);

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
            'property_id' => [
                'nullable',
                'integer',
                Rule::exists('properties', 'id')->where('property_owner_id', $user->id)->whereNull('archived_at'),
            ],
        ]);

        $emailChanged = isset($validated['email']) && $validated['email'] !== $resident->email;

        $updateData = [
            'name' => $validated['name'],
        ];

        if ($emailChanged) {
            $updateData['email'] = $validated['email'];
            $updateData['email_verified_at'] = null;
            $updateData['password'] = null;

            $cacheKey = "email_changes_{$resident->id}";
            $changesCount = Cache::get($cacheKey, 0);
            Cache::put($cacheKey, $changesCount + 1, now()->addYear());
        }

        $resident->update($updateData);

        if ($emailChanged) {
            $estate = $this->estateContext->getEstate();
            event(new ResidentCreated($resident, $estate, true));
        }

        $resident->profile()->update([
            'phone' => $validated['phone'] ?? null,
            'unit_number' => $validated['unit_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'property_id' => $validated['property_id'] ?? null,
        ]);

        return redirect()
            ->route('resident.property-owner.residents.index')
            ->with('success', 'Resident updated successfully.');
    }

    /**
     * Toggle resident suspension/deactivation status.
     */
    public function suspend(User $resident): RedirectResponse
    {
        $user = auth()->user();

        // Ensure this resident is managed by the Property Owner
        abort_if($resident->profile?->property_owner_id !== $user->id, 403);

        if ($resident->suspended_at) {
            $resident->update(['suspended_at' => null]);
            $message = 'Resident activated successfully.';
        } else {
            $resident->update(['suspended_at' => now()]);
            $message = 'Resident deactivated successfully.';
        }

        return back()->with('success', $message);
    }

    /**
     * Resend invitation for the managed resident.
     */
    public function resendInvitation(User $resident, ResendResidentInvitationAction $action): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        // Ensure this resident is managed by the Property Owner
        abort_if($resident->profile?->property_owner_id !== $user->id, 403);

        // Ensure the resident is not already accepted in the estate
        $status = $resident->estates()
            ->where('estates.id', $estate->id)
            ->first()
            ?->pivot
            ?->status;

        if ($status === 'accepted') {
            return back()->with('error', 'Cannot resend invitation. This resident has already accepted.');
        }

        $action->execute($resident, $estate);

        return back()->with('success', 'Invitation resent successfully.');
    }

    /**
     * Remove resident delegation (stop managing).
     */
    public function destroy(User $resident): RedirectResponse
    {
        $user = auth()->user();

        // Ensure this resident is managed by the Property Owner
        abort_if($resident->profile?->property_owner_id !== $user->id, 403);

        $resident->profile()->update([
            'property_owner_id' => null,
            'property_id' => null,
        ]);

        return redirect()
            ->route('resident.property-owner.residents.index')
            ->with('success', 'Resident delegation removed successfully.');
    }

    /**
     * Show form to invite a resident.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();
        $link = EstateInviteLink::where('estate_id', $estate->id)
            ->where('user_id', $user->id)
            ->where('role', 'resident')
            ->first();

        $properties = Property::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Resident/PropertyOwner/Residents/Create', [
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
            'properties' => $properties,
        ]);
    }

    /**
     * Invite a new resident manually.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'property_id' => [
                'nullable',
                'integer',
                Rule::exists('properties', 'id')->where('property_owner_id', $user->id)->whereNull('archived_at'),
            ],
        ]);

        \DB::transaction(function () use ($validated, $estate, $user) {
            $resident = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => null,
            ]);

            $estate->users()->attach($resident->id, [
                'status' => 'pending',
                'created_via' => 'property_owner_invite',
                'initiated_by' => $user->id,
                'initiated_at' => now(),
                'last_invited_by' => $user->id,
                'last_invited_at' => now(),
            ]);

            $role = Role::where('name', 'resident')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();

            app(ContextManager::class)->setSystemContext($estate->id);
            $resident->assignRole($role);

            $property = null;
            if (! empty($validated['property_id'])) {
                $property = Property::find($validated['property_id']);
            }

            // Create or update Invitation in the invitations table
            $invitation = app(CreateInvitationAction::class)->execute(
                email: $validated['email'],
                estate: $estate,
                relationshipType: 'resident',
                role: null,
                zoneId: $property?->zone_id,
                scopeType: 'estate',
                createdBy: $user
            );

            if ($invitation) {
                $resident->estates()->updateExistingPivot($estate->id, [
                    'invitation_id' => $invitation->id,
                ]);
            }

            UserProfile::create([
                'user_id' => $resident->id,
                'phone' => $validated['phone'] ?? null,
                'unit_number' => $validated['unit_number'] ?? null,
                'address' => $validated['address'] ?? null,
                'property_owner_id' => $user->id,
                'property_id' => $validated['property_id'] ?? null,
            ]);

            event(new ResidentCreated($resident, $estate, false));

            activity()
                ->performedOn($resident)
                ->causedBy($user)
                ->withProperties(['estate_id' => $estate->id])
                ->log('property owner invited resident '.$resident->email);
        });

        return redirect()
            ->route('resident.property-owner.residents.index')
            ->with('success', 'Resident invited successfully. They will receive an email to set up their account.');
    }

    /**
     * Store/Update Invite Link settings.
     */
    public function storeInviteLink(Request $request): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();
        $validated = $request->validate([
            'max_usages' => ['nullable', 'integer', 'min:1'],
            'requires_approval' => ['required', 'boolean'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ]);

        $link = EstateInviteLink::where('estate_id', $estate->id)
            ->where('user_id', $user->id)
            ->where('role', 'resident')
            ->first();

        if ($link) {
            $link->update([
                'max_usages' => $validated['max_usages'] ?? null,
                'requires_approval' => true,
                'expires_at' => $validated['expires_at'] ?? null,
            ]);
        } else {
            EstateInviteLink::create([
                'estate_id' => $estate->id,
                'user_id' => $user->id,
                'role' => 'resident',
                'token' => Str::random(32),
                'is_active' => true,
                'usage_count' => 0,
                'max_usages' => $validated['max_usages'] ?? null,
                'requires_approval' => true,
                'expires_at' => $validated['expires_at'] ?? null,
            ]);
        }

        return back()->with('success', 'Invite link settings updated successfully.');
    }

    /**
     * Regenerate Invite Link token.
     */
    public function regenerateInviteLink(): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $link = EstateInviteLink::where('estate_id', $estate->id)
            ->where('user_id', $user->id)
            ->where('role', 'resident')
            ->first();

        if (! $link) {
            return back()->with('error', 'No invite link to regenerate.');
        }

        $link->update([
            'token' => Str::random(32),
            'usage_count' => 0,
        ]);

        return back()->with('success', 'Invite link regenerated successfully.');
    }

    /**
     * Toggle Invite Link status.
     */
    public function toggleInviteLink(): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $link = EstateInviteLink::where('estate_id', $estate->id)
            ->where('user_id', $user->id)
            ->where('role', 'resident')
            ->first();

        if ($link) {
            $link->update(['is_active' => ! $link->is_active]);
            $status = $link->is_active ? 'enabled' : 'disabled';

            return back()->with('success', "Invite link {$status} successfully.");
        }

        return back()->with('error', 'No invite link found.');
    }

    /**
     * Delete Invite Link.
     */
    public function destroyInviteLink(): RedirectResponse
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $link = EstateInviteLink::where('estate_id', $estate->id)
            ->where('user_id', $user->id)
            ->where('role', 'resident')
            ->first();

        if (! $link) {
            return back()->with('error', 'No invite link to delete.');
        }

        $link->delete();

        return redirect()->route('resident.property-owner.residents.index')->with('success', 'Invite link deleted successfully.');
    }
}
