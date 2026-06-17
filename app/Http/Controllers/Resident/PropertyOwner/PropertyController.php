<?php

namespace App\Http\Controllers\Resident\PropertyOwner;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\EstateBoardPost;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of properties.
     */
    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $properties = Property::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->whereNull('archived_at')
            ->withCount(['residents'])
            ->orderBy('name')
            ->get()
            ->map(function ($property) use ($user) {
                // Calculate outstanding collections for this property
                $outstandingBalance = CollectionAssignment::query()
                    ->where('estate_id', $property->estate_id)
                    ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
                    ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
                    ->whereHas('user.profile', fn ($q) => $q->where('property_id', $property->id))
                    ->get()
                    ->sum(fn ($assignment) => $assignment->amount_due - $assignment->amount_paid);

                return [
                    'id' => $property->id,
                    'ulid' => $property->ulid,
                    'name' => $property->name,
                    'residents_count' => $property->residents_count,
                    'outstanding_balance' => $outstandingBalance,
                    'created_at' => $property->created_at->format('M d, Y'),
                ];
            });

        return Inertia::render('Resident/PropertyOwner/Properties/Index', [
            'properties' => $properties,
        ]);
    }

    /**
     * Store a newly created property.
     */
    public function store(Request $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        Property::create([
            'estate_id' => $estate->id,
            'property_owner_id' => $user->id,
            'name' => $validated['name'],
        ]);

        return redirect()
            ->route('resident.property-owner.properties.index')
            ->with('success', 'Property created successfully.');
    }

    /**
     * Update the specified property.
     */
    public function update(Request $request, Property $property): RedirectResponse
    {
        $user = auth()->user();
        abort_if($property->property_owner_id !== $user->id, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $property->update([
            'name' => $validated['name'],
        ]);

        return redirect()
            ->route('resident.property-owner.properties.index')
            ->with('success', 'Property updated successfully.');
    }

    /**
     * Archive the specified property.
     */
    public function destroy(Property $property): RedirectResponse
    {
        $user = auth()->user();
        abort_if($property->property_owner_id !== $user->id, 403);

        // Deassociate residents assigned to this property
        UserProfile::where('property_id', $property->id)->update(['property_id' => null]);

        $property->update(['archived_at' => now()]);

        return redirect()
            ->route('resident.property-owner.properties.index')
            ->with('success', 'Property archived successfully.');
    }

    /**
     * Display property details.
     */
    public function show(Property $property): Response
    {
        $user = auth()->user();
        abort_if($property->property_owner_id !== $user->id, 403);
        $estate = $this->estateContext->getEstate();

        // 1. Overview data
        $residents = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_id', $property->id))
            ->with(['profile'])
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'ulid' => $r->ulid,
                'name' => $r->name,
                'phone' => $r->profile?->phone,
                'unit_number' => $r->profile?->unit_number,
                'status' => $r->suspended_at ? 'suspended' : 'active',
            ]);

        // Calculate outstanding balance globally
        $outstandingBalance = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->selectRaw('SUM(amount_due - amount_paid) as total')
            ->value('total') ?? 0;

        // Outstanding Collections (Paginated)
        $outstandingQuery = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id));

        if (request()->filled('search_collection')) {
            $outstandingQuery->where(function ($q) {
                $q->whereHas('collection', fn ($q2) => $q2->where('name', 'like', '%'.request()->search_collection.'%'))
                  ->orWhereHas('user', fn ($q2) => $q2->where('name', 'like', '%'.request()->search_collection.'%'));
            });
        }

        $outstandingPaginated = $outstandingQuery->with(['collection', 'user'])->paginate(10, ['*'], 'collections_page');

        $outstandingCollections = [
            'data' => collect($outstandingPaginated->items())->map(fn ($assignment) => [
                'id' => $assignment->id,
                'resident_name' => $assignment->user->name,
                'name' => $assignment->collection->name,
                'amount_due' => $assignment->amount_due,
                'amount_paid' => $assignment->amount_paid,
                'status' => $assignment->status,
                'due_date' => $assignment->due_date?->format('M d, Y'),
            ]),
            'total' => $outstandingPaginated->total(),
            'per_page' => $outstandingPaginated->perPage(),
            'current_page' => $outstandingPaginated->currentPage(),
            'next_page_url' => $outstandingPaginated->nextPageUrl(),
        ];

        // Total Collected
        $totalCollected = Payment::query()
            ->where('estate_id', $estate->id)
            ->whereHas('assignment', fn ($q) => $q->where('property_id', $property->id))
            ->whereHas('assignment.collection', fn ($q) => $q->where('created_by', $user->id))
            ->sum('amount');

        // Recent Payments
        $payments = Payment::query()
            ->where('estate_id', $estate->id)
            ->whereHas('assignment', fn ($q) => $q->where('property_id', $property->id))
            ->whereHas('assignment.collection', fn ($q) => $q->where('created_by', $user->id))
            ->with(['assignment.user', 'assignment.collection'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'resident_name' => $p->assignment->user->name,
                'collection_name' => $p->assignment->collection->name,
                'amount' => $p->amount,
                'status' => $p->status,
                'date' => $p->created_at->format('M d, Y'),
            ]);

        // Announcements targeting this property or all
        $announcements = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->where(function ($q) use ($property) {
                $q->where('applies_to', 'all')
                    ->orWhere(function ($q2) use ($property) {
                        $q2->where('applies_to', 'custom')
                            ->whereHas('targets', fn ($qt) => $qt->where('target_type', 'property')->where('target_id', $property->id));
                    });
            })
            ->latest()
            ->get()
            ->map(fn ($post) => [
                'id' => $post->id,
                'hashid' => $post->hashid,
                'title' => $post->title,
                'status' => $post->status->value,
                'applies_to' => $post->applies_to,
                'created_at' => $post->created_at->format('M d, Y'),
            ]);

        // Activity timeline items generated dynamically
        $activities = [];

        // Residents additions / removals could be mapped, but let's gather collection creations, payments, announcements
        foreach ($outstandingPaginated->items() as $c) {
            $activities[] = [
                'type' => 'collection_created',
                'description' => "Collection '{$c->collection->name}' of ".number_format($c->amount_due)." was assigned to {$c->user->name}.",
                'date' => $c->due_date?->format('M d, Y'),
                'timestamp' => strtotime($c->due_date?->format('Y-m-d H:i:s') ?? now()),
            ];
        }

        foreach ($payments as $p) {
            $activities[] = [
                'type' => 'collection_paid',
                'description' => 'Payment of '.number_format($p['amount'])." received from {$p['resident_name']} for '{$p['collection_name']}'.",
                'date' => $p['date'],
                'timestamp' => strtotime($p['date']),
            ];
        }

        foreach ($announcements as $a) {
            $activities[] = [
                'type' => 'announcement_sent',
                'description' => "Announcement '{$a['title']}' was sent.",
                'date' => $a['created_at'],
                'timestamp' => strtotime($a['created_at']),
            ];
        }

        // Sort activities desc
        usort($activities, fn ($a, $b) => $b['timestamp'] - $a['timestamp']);

        // Eligible residents for assignment (managed residents not on this property)
        $eligibleResidents = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id)
                ->where(fn ($q2) => $q2->where('property_id', '!=', $property->id)->orWhereNull('property_id'))
            )
            ->whereDoesntHave('profile', fn ($q) => $q->where('property_id', $property->id))
            ->forEstate($estate->id)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'property' => $r->profile?->property?->name ?? 'None',
            ]);

        return Inertia::render('Resident/PropertyOwner/Properties/Show', [
            'property' => [
                'id' => $property->id,
                'ulid' => $property->ulid,
                'name' => $property->name,
            ],
            'residents' => $residents,
            'outstandingCollections' => $outstandingCollections,
            'outstandingBalance' => (float) $outstandingBalance,
            'totalCollected' => (float) $totalCollected,
            'payments' => $payments,
            'announcements' => $announcements,
            'activities' => $activities,
            'eligibleResidents' => $eligibleResidents,
            'filters' => [
                'search_collection' => request()->search_collection ?? '',
            ],
        ]);
    }

    /**
     * Assign a resident to the property.
     */
    public function assignResident(Request $request, Property $property): RedirectResponse
    {
        $user = auth()->user();
        abort_if($property->property_owner_id !== $user->id, 403);

        $validated = $request->validate([
            'resident_ids' => ['required', 'array', 'min:1'],
            'resident_ids.*' => ['required', 'integer', 'exists:users,id'],
        ]);

        $residents = User::whereIn('id', $validated['resident_ids'])->get();
        foreach ($residents as $resident) {
            abort_if($resident->profile?->property_owner_id !== $user->id, 403);
            $resident->profile()->update([
                'property_id' => $property->id,
            ]);
        }

        $count = count($residents);
        $message = $count === 1
            ? "Resident assigned to {$property->name} successfully."
            : "{$count} residents assigned to {$property->name} successfully.";

        return back()->with('success', $message);
    }

    /**
     * Remove a resident from the property.
     */
    public function removeResident(Request $request, Property $property): RedirectResponse
    {
        $user = auth()->user();
        abort_if($property->property_owner_id !== $user->id, 403);

        $validated = $request->validate([
            'resident_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $resident = User::findOrFail($validated['resident_id']);
        abort_if($resident->profile?->property_owner_id !== $user->id, 403);

        $resident->profile()->update([
            'property_id' => null,
        ]);

        return back()->with('success', "Resident removed from {$property->name} successfully.");
    }
}
