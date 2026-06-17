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
use Carbon\Carbon;
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

        // Metrics for Collection Health
        $billsPaid = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->where('status', 'paid')
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->count();

        $billsOutstanding = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->whereIn('status', ['pending', 'grace', 'partial'])
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->count();

        $billsOverdue = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->where('status', 'overdue')
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->count();

        $pendingBillsCount = $billsOutstanding + $billsOverdue;

        $totalBillsCount = $billsPaid + $pendingBillsCount;
        $collectionRate = $totalBillsCount > 0 ? round(($billsPaid / $totalBillsCount) * 100) : 0;

        // Current Month Progress
        $currentMonthExpected = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->whereMonth('due_date', now()->month)
            ->whereYear('due_date', now()->year)
            ->sum('amount_due');

        $currentMonthCollected = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->whereMonth('due_date', now()->month)
            ->whereYear('due_date', now()->year)
            ->sum('amount_paid');

        // Outstanding Collections (Paginated with Filters)
        $outstandingQuery = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id));

        if (request()->filled('status') && request()->status !== 'all') {
            if (request()->status === 'outstanding') {
                $outstandingQuery->whereIn('status', ['pending', 'overdue', 'grace', 'partial']);
            } else {
                $outstandingQuery->where('status', request()->status);
            }
        } else {
            // Default to not showing fully paid in the outstanding list unless filtering
            $outstandingQuery->whereIn('status', ['pending', 'overdue', 'grace', 'partial']);
        }

        if (request()->filled('search_collection')) {
            $outstandingQuery->where(function ($q) {
                $q->whereHas('collection', fn ($q2) => $q2->where('name', 'like', '%'.request()->search_collection.'%'))
                    ->orWhereHas('user', fn ($q2) => $q2->where('name', 'like', '%'.request()->search_collection.'%'));
            });
        }

        $outstandingPaginated = $outstandingQuery->with(['collection', 'user'])->paginate(10, ['*'], 'collections_page');

        $outstandingCollections = [
            'data' => collect($outstandingPaginated->items())->map(function ($assignment) {
                $dueStatus = '';
                if ($assignment->due_date) {
                    $days = now()->startOfDay()->diffInDays($assignment->due_date->startOfDay(), false);
                    if ($days == 0) {
                        $dueStatus = 'Due today';
                    } elseif ($days == 1) {
                        $dueStatus = 'Due tomorrow';
                    } elseif ($days == -1) {
                        $dueStatus = 'Overdue by 1 day';
                    } elseif ($days > 1) {
                        $dueStatus = "Due in {$days} days";
                    } elseif ($days < -1) {
                        $dueStatus = 'Overdue by '.abs($days).' days';
                    }
                }

                return [
                    'id' => $assignment->id,
                    'resident_name' => $assignment->user->name,
                    'name' => $assignment->collection->name,
                    'amount_due' => $assignment->amount_due,
                    'amount_paid' => $assignment->amount_paid,
                    'status' => $assignment->status,
                    'due_date' => $assignment->due_date?->format('M d, Y'),
                    'due_status' => $dueStatus,
                ];
            }),
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

        // Fetch recent assignments for the timeline
        $recentAssignments = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->where('property_id', $property->id)
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->with(['collection', 'user'])
            ->latest()
            ->take(10)
            ->get();

        foreach ($recentAssignments as $c) {
            $activities[] = [
                'type' => 'collection_created',
                'description' => "{$c->collection->name} generated for {$c->user->name}",
                'amount' => $c->amount_due,
                'date' => $c->created_at->diffForHumans(),
                'timestamp' => strtotime($c->created_at->format('Y-m-d H:i:s')),
            ];
        }

        foreach ($payments as $p) {
            $activities[] = [
                'type' => 'payment_received',
                'description' => "{$p['resident_name']} paid ₦".number_format($p['amount']),
                'amount' => $p['amount'],
                'date' => Carbon::parse($p['date'])->diffForHumans(),
                'timestamp' => strtotime($p['date']),
            ];
        }

        usort($activities, fn ($a, $b) => $b['timestamp'] <=> $a['timestamp']);
        $activities = array_slice($activities, 0, 10);

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
            'metrics' => [
                'bills_paid' => $billsPaid,
                'bills_outstanding' => $billsOutstanding,
                'bills_overdue' => $billsOverdue,
                'pending_count' => $pendingBillsCount,
                'collection_rate' => $collectionRate,
                'current_month_collected' => $currentMonthCollected,
                'current_month_expected' => $currentMonthExpected,
            ],
            'payments' => $payments,
            'announcements' => $announcements,
            'activities' => $activities,
            'eligibleResidents' => $eligibleResidents,
            'filters' => [
                'search_collection' => request()->search_collection ?? '',
                'status' => request()->status ?? 'outstanding',
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
