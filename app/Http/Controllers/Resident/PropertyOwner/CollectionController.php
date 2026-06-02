<?php

namespace App\Http\Controllers\Resident\PropertyOwner;

use App\Http\Controllers\Controller;
use App\Jobs\Admin\PublishCollectionJob;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\CollectionTarget;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of collections created by this Property Owner.
     */
    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $collections = Collection::query()
            ->where('estate_id', $estate->id)
            ->where('created_by', $user->id)
            ->withCount(['assignments'])
            ->latest()
            ->get()
            ->map(function ($c) {
                $paidCount = $c->assignments()->where('status', 'paid')->count();
                $totalAmount = $c->assignments()->sum('amount_due');
                $collectedAmount = $c->assignments()->sum('amount_paid');

                return [
                    'id' => $c->id,
                    'ulid' => $c->ulid,
                    'name' => $c->name,
                    'amount' => $c->amount,
                    'status' => $c->status,
                    'due_at' => $c->due_at?->format('M d, Y'),
                    'assignments_count' => $c->assignments_count,
                    'paid_count' => $paidCount,
                    'total_amount' => $totalAmount,
                    'collected_amount' => $collectedAmount,
                    'created_at' => $c->created_at->format('M d, Y'),
                ];
            });

        return Inertia::render('Resident/PropertyOwner/Collections/Index', [
            'collections' => $collections,
        ]);
    }

    /**
     * Show form for creating a new collection.
     */
    public function create(): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $residents = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id))
            ->forEstate($estate->id)
            ->get(['id', 'name']);

        $properties = Property::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Resident/PropertyOwner/Collections/Create', [
            'residents' => $residents,
            'properties' => $properties,
        ]);
    }

    /**
     * Store and activate a new collection.
     */
    public function store(Request $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'amount' => ['required', 'integer', 'min:1'],
            'due_at' => ['required', 'date', 'after:today'],
            'applies_to' => ['required', 'string', 'in:all,target'],
            'targets' => ['required_if:applies_to,target', 'array'],
            'targets.*.type' => ['required', 'string', 'in:user,property'],
            'targets.*.id' => ['required', 'integer'],
        ]);

        DB::transaction(function () use ($estate, $user, $validated) {
            $collection = Collection::create([
                'estate_id' => $estate->id,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'amount' => $validated['amount'],
                'billing_type' => 'one_time',
                'start_date' => now()->toDateString(),
                'due_at' => $validated['due_at'],
                'due_day' => 1,
                'grace_days' => 0,
                'applies_to' => $validated['applies_to'],
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            if ($collection->applies_to === 'target') {
                foreach ($validated['targets'] as $t) {
                    $targetType = $t['type'] === 'user' ? User::class : Property::class;

                    // Security check: ensure target user or property is owned/managed by the Property Owner
                    if ($t['type'] === 'user') {
                        $targetUser = User::find($t['id']);
                        if (! $targetUser || $targetUser->profile?->property_owner_id !== $user->id) {
                            continue;
                        }
                    } else {
                        $targetProperty = Property::find($t['id']);
                        if (! $targetProperty || $targetProperty->property_owner_id !== $user->id) {
                            continue;
                        }
                    }

                    CollectionTarget::create([
                        'collection_id' => $collection->id,
                        'target_type' => $targetType,
                        'target_id' => $t['id'],
                    ]);
                }
            }

            // Publish and assign immediately
            PublishCollectionJob::dispatch($collection->id);
        });

        return redirect()
            ->route('resident.property-owner.collections.index')
            ->with('success', 'Collection created and published successfully.');
    }

    /**
     * View details of a collection.
     */
    public function show(Collection $collection): Response
    {
        $user = auth()->user();
        abort_if($collection->created_by !== $user->id, 403);

        $collection->load(['targets']);

        $assignments = CollectionAssignment::query()
            ->where('collection_id', $collection->id)
            ->with(['user.profile.property'])
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'ulid' => $a->ulid,
                'resident_name' => $a->user->name,
                'property_name' => $a->user->profile?->property?->name ?? '—',
                'amount_due' => $a->amount_due,
                'amount_paid' => $a->amount_paid,
                'status' => $a->status,
                'due_date' => $a->due_date?->format('M d, Y'),
                'paid_at' => $a->updated_at && $a->status === 'paid' ? $a->updated_at->format('M d, Y') : null,
            ]);

        $collected = $collection->assignments()->sum('amount_paid');
        $outstanding = $collection->assignments()->sum('amount_due') - $collected;

        return Inertia::render('Resident/PropertyOwner/Collections/Show', [
            'collection' => [
                'id' => $collection->id,
                'ulid' => $collection->ulid,
                'name' => $collection->name,
                'description' => $collection->description,
                'amount' => $collection->amount,
                'due_at' => $collection->due_at?->format('M d, Y'),
                'status' => $collection->status,
            ],
            'assignments' => $assignments,
            'collected' => $collected,
            'outstanding' => $outstanding,
        ]);
    }

    /**
     * Record a manual payment on an assignment.
     */
    public function recordPayment(Request $request, CollectionAssignment $assignment): RedirectResponse
    {
        $user = auth()->user();

        // Ensure this assignment belongs to a collection created by this Property Owner
        abort_if($assignment->collection->created_by !== $user->id, 403);

        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1', 'max:'.($assignment->amount_due - $assignment->amount_paid)],
            'reference' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($assignment, $validated) {
            $newPaid = $assignment->amount_paid + $validated['amount'];
            $status = $newPaid >= $assignment->amount_due ? 'paid' : 'partial';

            $assignment->update([
                'amount_paid' => $newPaid,
                'status' => $status,
            ]);

            Payment::create([
                'estate_id' => $assignment->estate_id,
                'collection_assignment_id' => $assignment->id,
                'amount' => $validated['amount'],
                'status' => 'success',
                'reference' => $validated['reference'] ?? 'MANUAL-'.strtoupper(str_random(10)),
                'channel' => 'manual',
            ]);
        });

        return back()->with('success', 'Payment recorded successfully.');
    }
}
