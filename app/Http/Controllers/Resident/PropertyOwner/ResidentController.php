<?php

namespace App\Http\Controllers\Resident\PropertyOwner;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\Property;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ResidentController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a list of managed residents.
     */
    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $residents = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id))
            ->forEstate($estate->id)
            ->with(['profile.property', 'estates' => fn ($q) => $q->where('estates.id', $estate->id)])
            ->get()
            ->map(function ($u) use ($user) {
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

        return Inertia::render('Resident/PropertyOwner/Residents/Index', [
            'residents' => $residents,
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
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'property_id' => [
                'nullable',
                'integer',
                Rule::exists('properties', 'id')->where('property_owner_id', $user->id)->whereNull('archived_at'),
            ],
        ]);

        $resident->update([
            'name' => $validated['name'],
        ]);

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
}
