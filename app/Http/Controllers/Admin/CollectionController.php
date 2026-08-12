<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\EstateSettings;
use App\Models\Payment;
use App\Models\User;
use App\Services\Admin\CollectionService;
use App\Services\EstateContextService;
use App\Services\PaystackService;
use App\Services\ZoneAudienceResolver;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CollectionController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private CollectionService $collectionService,
        private PaystackService $paystackService,
        private ZoneAudienceResolver $zoneAudience,
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
            'active_collections' => Collection::where('estate_id', $estate->id)
                ->where('status', 'active')
                ->whereDoesntHave('creator.roles', function ($sq) use ($estate) {
                    $sq->where('name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estate->id);
                })->count(),
            'defaulters_count' => CollectionAssignment::whereHas('collection', function ($q) use ($estate) {
                $q->where('estate_id', $estate->id)
                    ->whereDoesntHave('creator.roles', function ($sq) use ($estate) {
                        $sq->where('name', 'property_owner')
                            ->where('model_has_roles.estate_id', $estate->id);
                    });
            })
                ->whereRaw('(amount_due - amount_paid) > 0')
                ->where(function ($q) {
                    $q->where('status', 'overdue')
                        ->orWhere(function ($sq) {
                            $sq->whereIn('status', ['pending', 'partial'])
                                ->where(function ($subq) {
                                    $subq->whereNotNull('grace_until')->where('grace_until', '<', Carbon::today())
                                        ->orWhere(function ($ssq) {
                                            $ssq->whereNull('grace_until')->where('due_date', '<', Carbon::today());
                                        });
                                });
                        });
                })
                ->distinct('user_id')
                ->count('user_id'),
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

            // ── Deferred: Financial Health Score ──────────────────────────────
            'healthScore' => Inertia::defer(function () use ($estate) {
                $estateId = $estate->id;

                /**
                 * @param  Builder  $q
                 */
                $estateScope = fn ($q) => $q->where('estate_id', $estateId)
                    ->whereDoesntHave('creator.roles', fn ($sq) => $sq
                        ->where('name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estateId));

                $total = CollectionAssignment::whereHas('collection', $estateScope)->count();

                if ($total === 0) {
                    return [
                        'score' => 0,
                        'grade' => 'No Data',
                        'color' => 'slate',
                        'explanation' => 'No collection assignments have been created yet.',
                    ];
                }

                $paid = CollectionAssignment::whereHas('collection', $estateScope)->where('status', 'paid')->count();
                $overdue = CollectionAssignment::whereHas('collection', $estateScope)->where('status', 'overdue')->count();

                $collectionRate = $paid / $total;
                $overdueRatio = $overdue / $total;

                $score = (int) min(100, round(
                    $collectionRate * 55 +
                    (1 - $overdueRatio) * 30 +
                    15
                ));

                if ($score >= 85) {
                    $grade = 'Excellent';
                    $color = 'emerald';
                    $explanation = 'Collections are progressing excellently. Keep the momentum.';
                } elseif ($score >= 70) {
                    $grade = 'Good';
                    $color = 'blue';
                    $explanation = 'Collections are on track. A few reminders could push you further.';
                } elseif ($score >= 50) {
                    $grade = 'At Risk';
                    $color = 'amber';
                    $explanation = 'Collections are slowing down. Send reminders today.';
                } else {
                    $grade = 'Critical';
                    $color = 'rose';
                    $explanation = 'Significant overdue balances detected. Immediate attention required.';
                }

                return compact('score', 'grade', 'color', 'explanation');
            }),

            // ── Deferred: Today & This Week Snapshot ──────────────────────────
            'todaySnapshot' => Inertia::defer(function () use ($estate) {
                $estateId = $estate->id;

                $estateScope = fn ($q) => $q->where('estate_id', $estateId)
                    ->whereDoesntHave('creator.roles', fn ($sq) => $sq
                        ->where('name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estateId));

                $todayPayments = Payment::where('status', 'success')
                    ->whereDate('paid_at', Carbon::today())
                    ->whereHas('assignment.collection', $estateScope)
                    ->get();

                $weekPayments = Payment::where('status', 'success')
                    ->where('paid_at', '>=', Carbon::now()->subDays(6)->startOfDay())
                    ->whereHas('assignment.collection', $estateScope)
                    ->get();

                return [
                    'collected_today' => (int) $todayPayments->sum('amount'),
                    'payments_today' => $todayPayments->count(),
                    'payers_today' => $todayPayments->unique('user_id')->count(),
                    'collected_this_week' => (int) $weekPayments->sum('amount'),
                    'payments_this_week' => $weekPayments->count(),
                ];
            }),

            // ── Deferred: Recent Payment Activity ─────────────────────────────
            'recentActivity' => Inertia::defer(function () use ($estate) {
                $estateId = $estate->id;

                $estateScope = fn ($q) => $q->where('estate_id', $estateId)
                    ->whereDoesntHave('creator.roles', fn ($sq) => $sq
                        ->where('name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estateId));

                return Payment::with(['user', 'assignment.collection'])
                    ->where('status', 'success')
                    ->whereHas('assignment.collection', $estateScope)
                    ->latest('paid_at')
                    ->take(10)
                    ->get()
                    ->map(fn ($p) => [
                        'id' => $p->id,
                        'user_name' => $p->user?->name ?? 'Unknown',
                        'amount' => (int) $p->amount,
                        'collection_name' => $p->assignment?->collection?->name ?? 'Collection',
                        'paid_at_human' => $p->paid_at
                            ? Carbon::parse($p->paid_at)->diffForHumans()
                            : $p->created_at->diffForHumans(),
                    ])
                    ->toArray();
            }),

            // ── Deferred: Per-Collection Performance Insights ─────────────────
            'collectionInsights' => Inertia::defer(function () use ($estate) {
                $estateId = $estate->id;

                $activeCollections = Collection::where('estate_id', $estateId)
                    ->where('status', 'active')
                    ->whereDoesntHave('creator.roles', fn ($q) => $q
                        ->where('name', 'property_owner')
                        ->where('model_has_roles.estate_id', $estateId))
                    ->select('id', 'ulid', 'name', 'due_at')
                    ->withSum('assignments as total_expected', 'amount_due')
                    ->withSum('assignments as total_collected', 'amount_paid')
                    ->withCount(['assignments as overdue_count' => fn ($q) => $q->where('status', 'overdue')])
                    ->withCount(['assignments as pending_count' => fn ($q) => $q->whereIn('status', ['pending', 'partial'])])
                    ->withCount('assignments as total_count')
                    ->get()
                    ->map(fn ($c) => [
                        'id' => $c->id,
                        'ulid' => $c->ulid,
                        'name' => $c->name,
                        'due_at' => $c->due_at,
                        'expected' => (int) $c->total_expected,
                        'collected' => (int) $c->total_collected,
                        'outstanding' => (int) ($c->total_expected - $c->total_collected),
                        'rate' => $c->total_expected > 0
                            ? (int) round($c->total_collected / $c->total_expected * 100)
                            : 0,
                        'overdue_count' => (int) $c->overdue_count,
                        'pending_count' => (int) $c->pending_count,
                        'total_count' => (int) $c->total_count,
                    ]);

                $best = $activeCollections->sortByDesc('rate')->first();
                $worst = $activeCollections->where('outstanding', '>', 0)->sortBy('rate')->first();
                $largestOutstanding = $activeCollections->sortByDesc('outstanding')->first();

                // Ensure worst differs from best
                if ($worst && $best && $worst['id'] === $best['id']) {
                    $worst = $activeCollections
                        ->where('outstanding', '>', 0)
                        ->sortBy('rate')
                        ->skip(1)
                        ->first();
                }

                return [
                    'best' => $best,
                    'worst' => $worst ?: null,
                    'largest_outstanding' => $largestOutstanding,
                    'all' => $activeCollections->values()->toArray(),
                ];
            }),
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
            'zones' => $this->zoneAudience->zonesForEstate($estate->id),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureBankingIsSetup();
        $estate = $this->estateContext->getEstate();
        $this->collectionService->createCollection($estate, $this->validatedCollectionPayload($request, $estate->id));

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
            'assignments' => $query->paginate(15)->withQueryString(),
            'totalResidents' => User::forEstate($estate->id)->withRole('resident', $estate->id)->count(),
            'filters' => $request->only(['search', 'status']),
            'settlement' => [
                'bank_name' => $settings->bank_name,
                'paystack_subaccount_code' => $settings->paystack_subaccount_code,
            ],
            'hasBanking' => ! empty($settings->paystack_subaccount_code),
            'canDelete' => $collection->status === 'draft'
                || ($collection->status === 'active' && ! $collection->assignments()->where('amount_paid', '>', 0)->exists()),

            // Deferred props — loaded after initial render to keep TTFB fast
            'recentPayments' => Inertia::defer(fn () => Payment::query()
                ->whereHas('assignment', fn ($q) => $q->where('collection_id', $collection->id))
                ->with('user')
                ->where('status', 'success')
                ->latest('paid_at')
                ->take(10)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'user_name' => $p->user?->name ?? 'Unknown',
                    'amount' => $p->amount,
                    'provider' => $p->provider,
                    'paid_at' => $p->paid_at?->toIso8601String(),
                    'paid_at_human' => $p->paid_at?->diffForHumans(),
                ])),

            'dailyTrend' => Inertia::defer(fn () => Payment::query()
                ->whereHas('assignment', fn ($q) => $q->where('collection_id', $collection->id))
                ->where('status', 'success')
                ->where('paid_at', '>=', now()->subDays(13)->startOfDay())
                ->select(DB::raw('DATE(paid_at) as date'), DB::raw('SUM(amount) as total'))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn ($row) => [
                    'date' => $row->date,
                    'total' => (int) $row->total,
                ])),
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
            'zones' => $this->zoneAudience->zonesForEstate($estate->id),
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $this->ensureBankingIsSetup();
        $this->authorizeCollection($collection);
        $this->ensureIsDraft($collection);
        $this->collectionService->updateCollection($collection, $this->validatedCollectionPayload($request, $collection->estate_id));

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

    /**
     * @return array<string, mixed>
     */
    private function validatedCollectionPayload(Request $request, int $estateId): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:1'],
            'billing_type' => ['required', 'string', 'in:one_time,recurring'],
            'recurring_interval' => ['nullable', 'string', 'in:weekly,monthly,yearly'],
            'start_date' => ['required', 'date'],
            'due_at' => ['nullable', 'date'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'grace_days' => ['nullable', 'integer', 'min:0'],
            'late_fee' => ['nullable', 'numeric', 'min:0'],
            'applies_to' => ['required', 'string', 'in:all,target,property_owner,zone'],
            'targets' => ['required_if:applies_to,target', 'array'],
            'targets.*' => ['integer', 'exists:users,id'],
            'zones' => ['required_if:applies_to,zone', 'array', 'min:1'],
            'zones.*' => ['integer', Rule::exists('zones', 'id')->where('estate_id', $estateId)],
        ]);
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
