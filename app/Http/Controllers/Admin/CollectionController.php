<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Admin\CollectionService;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CollectionController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private CollectionService $collectionService,
        private PaystackService $paystackService,
    ) {}

    public function index(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        $query = Collection::where('estate_id', $estate->id)
            ->whereDoesntHave('creator.roles', function ($q) use ($estate) {
                $q->where('name', 'property_owner')
                    ->where('model_has_roles.estate_id', $estate->id);
            })
            ->withCount(['assignments', 'targets'])
            ->latest();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $collections = $query->paginate(10)->withQueryString();

        $stats = [
            'total_expected' => (int) CollectionAssignment::whereHas('collection', function ($q) use ($estate) {
                $q->where('estate_id', $estate->id)
                    ->whereDoesntHave('creator.roles', function ($sq) use ($estate) {
                        $sq->where('name', 'property_owner')
                            ->where('model_has_roles.estate_id', $estate->id);
                    });
            })->sum('amount_due'),
            'total_realised' => (int) CollectionAssignment::whereHas('collection', function ($q) use ($estate) {
                $q->where('estate_id', $estate->id)
                    ->whereDoesntHave('creator.roles', function ($sq) use ($estate) {
                        $sq->where('name', 'property_owner')
                            ->where('model_has_roles.estate_id', $estate->id);
                    });
            })->sum('amount_paid'),
        ];

        return Inertia::render('Admin/Collections/Index', [
            'collections' => $collections,
            'totalResidents' => User::forEstate($estate->id)->withRole('resident', $estate->id)->count(),
            'hasBanking' => ! empty($settings->paystack_subaccount_code),
            'banks' => $this->paystackService->getBanks(),
            'settlement' => [
                'bank_name' => $settings->bank_name,
                'bank_code' => $settings->bank_code,
                'account_number' => $settings->account_number,
                'account_name' => $settings->account_name,
            ],
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
            ],
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        $this->ensureBankingIsSetup();
        $estate = $this->estateContext->getEstate();
        $residents = User::forEstate($estate->id)
            ->where(function ($query) use ($estate) {
                $query->withRole('resident', $estate->id)
                    ->orWhere(function ($q) use ($estate) {
                        $q->withRole('property_owner', $estate->id);
                    });
            })
            ->get()
            ->map(function ($user) use ($estate) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_property_owner' => $user->roles()
                        ->where('roles.name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estate->id)
                        ->exists(),
                ];
            });

        return Inertia::render('Admin/Collections/Create', [
            'residents' => $residents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureBankingIsSetup();
        $estate = $this->estateContext->getEstate();
        $this->collectionService->createCollection($estate, $request->all());

        return redirect()->route('admin.collections.index')
            ->with('success', 'Collection created successfully.');
    }

    public function show(Request $request, Collection $collection): Response
    {
        $this->authorizeCollection($collection);
        $collection->load(['targets', 'creator'])->loadCount('targets');
        $estate = $this->estateContext->getEstate();
        $stats = $this->collectionService->getCollectionStats($collection);

        $settings = EstateSettings::forEstate($estate->id);

        $query = $collection->assignments()->with('user')->latest();

        if ($request->has('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $today = Carbon::today()->toDateString();
            if ($request->status === 'paid') {
                $query->where('status', 'paid');
            } elseif ($request->status === 'overdue') {
                $query->where(function ($q) use ($today) {
                    $q->where('status', 'overdue')
                        ->orWhere(function ($sq) use ($today) {
                            $sq->where('status', 'partial')
                                ->where(function ($gq) use ($today) {
                                    $gq->where(function ($sub) use ($today) {
                                        $sub->whereNull('grace_until')
                                            ->where('due_date', '<', $today);
                                    })->orWhere(function ($sub) use ($today) {
                                        $sub->whereNotNull('grace_until')
                                            ->where('grace_until', '<', $today);
                                    });
                                });
                        });
                });
            } elseif ($request->status === 'pending') {
                $query->where(function ($q) use ($today) {
                    $q->whereIn('status', ['pending', 'grace'])
                        ->orWhere(function ($sq) use ($today) {
                            $sq->where('status', 'partial')
                                ->where(function ($gq) use ($today) {
                                    $gq->where(function ($sub) use ($today) {
                                        $sub->whereNull('grace_until')
                                            ->where('due_date', '>=', $today);
                                    })->orWhere(function ($sub) use ($today) {
                                        $sub->whereNotNull('grace_until')
                                            ->where('grace_until', '>=', $today);
                                    });
                                });
                        });
                });
            }
        }

        return Inertia::render('Admin/Collections/Show', [
            'collection' => $collection,
            'stats' => $stats,
            'assignments' => $query->paginate(10)->withQueryString(),
            'totalResidents' => User::forEstate($estate->id)->withRole('resident', $estate->id)->count(),
            'filters' => $request->only(['search', 'status']),
            'settlement' => [
                'bank_name' => $settings->bank_name,
                'paystack_subaccount_code' => $settings->paystack_subaccount_code,
            ],
            'hasBanking' => ! empty($settings->paystack_subaccount_code),
            'canDelete' => $collection->status === 'draft'
                || ($collection->status === 'active' && ! $collection->assignments()->where('amount_paid', '>', 0)->exists()),
        ]);
    }

    public function edit(Collection $collection): Response
    {
        $this->ensureBankingIsSetup();
        $this->authorizeCollection($collection);
        $this->ensureIsDraft($collection);
        $collection->load('targets')->loadCount('targets');
        $estate = $this->estateContext->getEstate();
        $residents = User::forEstate($estate->id)
            ->where(function ($query) use ($estate) {
                $query->withRole('resident', $estate->id)
                    ->orWhere(function ($q) use ($estate) {
                        $q->withRole('property_owner', $estate->id);
                    });
            })
            ->get()
            ->map(function ($user) use ($estate) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_property_owner' => $user->roles()
                        ->where('roles.name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estate->id)
                        ->exists(),
                ];
            });

        return Inertia::render('Admin/Collections/Edit', [
            'collection' => $collection,
            'residents' => $residents,
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $this->ensureBankingIsSetup();
        $this->authorizeCollection($collection);
        $this->ensureIsDraft($collection);
        $this->collectionService->updateCollection($collection, $request->all());

        return redirect()->route('admin.collections.index')
            ->with('success', 'Collection updated successfully.');
    }

    public function publish(Collection $collection): RedirectResponse
    {
        $this->ensureBankingIsSetup();
        $this->authorizeCollection($collection);
        $this->collectionService->publishCollection($collection);

        return back()->with('success', 'Collection published and assignments generated.');
    }

    public function remind(Collection $collection): RedirectResponse
    {
        $this->authorizeCollection($collection);
        $count = $this->collectionService->sendReminders($collection);

        return back()->with('success', "{$count} reminders sent successfully.");
    }

    public function export(Collection $collection): StreamedResponse
    {
        $this->authorizeCollection($collection);
        $csvData = $this->collectionService->exportActivity($collection);

        return response()->streamDownload(function () use ($csvData) {
            echo $csvData;
        }, "Collection-{$collection->id}-Activity.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function recordPayment(Request $request, CollectionAssignment $assignment): RedirectResponse
    {
        $remaining = $assignment->amount_due - $assignment->amount_paid;

        $request->validate([
            'amount' => "required|numeric|min:0.01|max:{$remaining}",
            'method' => 'required|string',
        ]);

        $this->collectionService->recordPayment($assignment, $request->all());

        return back()->with('success', 'Payment recorded successfully.');
    }

    public function destroy(Collection $collection): RedirectResponse
    {
        $this->authorizeCollection($collection);

        if ($collection->status === 'active') {
            $hasPaidAssignments = $collection->assignments()->where('amount_paid', '>', 0)->exists();

            if ($hasPaidAssignments) {
                abort(403, 'This collection cannot be deleted because payments have already been made.');
            }

            // Safe to delete — remove all unpaid assignments first
            $collection->assignments()->delete();
        }

        $collection->delete();

        return redirect()->route('admin.collections.index')
            ->with('success', 'Collection deleted.');
    }

    private function authorizeCollection(Collection $collection): void
    {
        $estate = $this->estateContext->getEstate();
        if ($collection->estate_id !== $estate->id) {
            abort(403);
        }
    }

    private function ensureIsDraft(Collection $collection): void
    {
        if ($collection->status !== 'draft') {
            abort(403, 'Published collections cannot be modified.');
        }
    }

    private function ensureBankingIsSetup(): void
    {
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        if (empty($settings->paystack_subaccount_code)) {
            abort(403, 'You must set up a bank account in your profile before performing this action.');
        }
    }
}
