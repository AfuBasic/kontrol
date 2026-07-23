<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\User;
use App\Services\EstateContextService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class VisitorLogController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of visitor access logs and operations center stats.
     */
    public function index(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();
        $today = Carbon::today();
        $filters = $request->only(['search', 'date', 'vehicle_plate', 'host_id', 'status', 'gate', 'verifier_id']);

        $checkoutEnabled = (bool) ($estate->settings?->visitor_checkout_enabled ?? false);

        return Inertia::render('Admin/Visitors/Index', [
            'logs' => Inertia::scroll(fn () => $this->paginatedLogs($estate->id, $filters)),
            'filters' => $filters,
            'hosts' => Inertia::defer(fn () => $this->hostsForFilters($estate)),
            'securityOfficers' => Inertia::defer(fn () => $this->securityOfficersForFilters($estate)),
            'checkoutEnabled' => $checkoutEnabled,
            'currentlyInsideList' => $this->safe(fn () => $this->buildCurrentlyInsideList($estate->id), []),
            'expectedArrivals' => $this->safe(fn () => $this->buildExpectedArrivals($estate->id), []),
            'attentionItems' => $this->safe(fn () => $this->buildAttentionItems($estate->id), []),
            'metrics' => $this->safe(fn () => $this->buildMetrics($estate->id, $today), [
                'currentlyInside' => 0,
                'visitorsToday' => 0,
                'pendingCheckout' => 0,
                'deniedEntries' => 0,
                'avgDuration' => 0,
                'expectedToday' => 0,
                'totalChecked' => 0,
            ]),
            'analytics' => Inertia::defer(fn () => $this->safe(
                fn () => $this->buildAnalytics($estate->id),
                ['trend' => [], 'peakHours' => [], 'mostVisited' => []]
            )),
            'liveFeed' => Inertia::defer(fn () => $this->safe(
                fn () => $this->buildLiveFeed($estate->id),
                []
            )),
        ]);
    }

    /**
     * Display Admin Visitor Calendar page.
     */
    public function calendar(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();

        return Inertia::render('Admin/Visitors/Calendar', [
            'hosts' => $this->hostsForFilters($estate),
            'initialFilters' => [
                'purpose' => $request->input('purpose'),
                'status' => $request->input('status'),
                'type' => $request->input('type'),
                'search' => $request->input('search'),
                'user_id' => $request->input('user_id'),
            ],
        ]);
    }

    /**
     * Return JSON calendar events for estate-wide visitor activity lazy-loading.
     */
    public function calendarEvents(Request $request): \Illuminate\Http\JsonResponse
    {
        $estate = $this->estateContext->getEstate();
        $startDate = $request->input('start') ? Carbon::parse($request->input('start')) : now()->startOfMonth();
        $endDate = $request->input('end') ? Carbon::parse($request->input('end')) : now()->endOfMonth();

        $accessCodeService = app(\App\Services\Resident\AccessCodeService::class);

        $events = $accessCodeService->getCalendarEvents(
            $startDate,
            $endDate,
            userId: $request->input('user_id') ? (int) $request->input('user_id') : null,
            estateId: $estate->id,
            filters: $request->only(['purpose', 'status', 'type', 'search'])
        );

        return response()->json($events);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return mixed
     */
    private function paginatedLogs(int $estateId, array $filters)
    {
        return AccessLog::query()
            ->where('estate_id', $estateId)
            ->with(['accessCode.user.profile', 'verifier:id,name', 'checkoutVerifier:id,name'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('accessCode', function ($sq) use ($search) {
                        $sq->where('code', 'like', "%{$search}%")
                            ->orWhere('visitor_name', 'like', "%{$search}%")
                            ->orWhere('visitor_phone', 'like', "%{$search}%");
                    })
                        ->orWhereHas('accessCode.user', function ($sq) use ($search) {
                            $sq->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['date'] ?? null, function ($query, $date) {
                $query->whereDate('verified_at', $date);
            })
            ->when($filters['vehicle_plate'] ?? null, function ($query, $plate) {
                $query->where('vehicle_plate_number', 'like', "%{$plate}%");
            })
            ->when($filters['host_id'] ?? null, function ($query, $hostId) {
                $query->whereHas('accessCode', function ($q) use ($hostId) {
                    $q->where('user_id', $hostId);
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                if ($status === 'inside') {
                    $query->whereNull('checked_out_at');
                } elseif ($status === 'checked_out') {
                    $query->whereNotNull('checked_out_at');
                }
            })
            ->when($filters['verifier_id'] ?? null, function ($query, $verifierId) {
                $query->where('verified_by', $verifierId);
            })
            ->orderByDesc('verified_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($log) => [
                'id' => $log->id,
                'code' => $log->accessCode?->code,
                'visitor' => [
                    'name' => $log->accessCode?->visitor_name ?? 'N/A',
                    'phone' => $log->accessCode?->visitor_phone ?? 'N/A',
                    'type' => $log->accessCode?->type,
                ],
                'host' => [
                    'id' => $log->accessCode?->user_id,
                    'name' => $log->accessCode?->user?->name ?? 'N/A',
                    'unit' => $log->accessCode?->user?->profile?->unit_number,
                    'address' => $log->accessCode?->user?->profile?->address,
                ],
                'purpose' => $log->accessCode?->purpose,
                'verified_at' => $log->verified_at->format('M j, Y g:i A'),
                'verified_at_human' => $log->verified_at->diffForHumans(),
                'verifier_name' => $log->verifier?->name ?? 'System',
                'checked_out_at' => $log->checked_out_at?->format('M j, Y g:i A'),
                'checked_out_at_human' => $log->checked_out_at?->diffForHumans(),
                'checkout_verifier_name' => $log->checkoutVerifier?->name ?? 'System',
                'duration_minutes' => $log->checked_out_at ? $log->checked_out_at->diffInMinutes($log->verified_at) : null,
                'gate' => $log->meta['gate'] ?? 'Main Gate',
                'vehicle' => $log->vehicle_make ? [
                    'make' => $log->vehicle_make,
                    'model' => $log->vehicle_model,
                    'plate' => $log->vehicle_plate_number,
                ] : null,
            ]);
    }

    /**
     * @return array<string, int|float>
     */
    private function buildMetrics(int $estateId, Carbon $today): array
    {
        $currentlyInside = AccessLog::where('estate_id', $estateId)
            ->whereNull('checked_out_at')
            ->count();

        $visitorsToday = AccessLog::where('estate_id', $estateId)
            ->whereDate('verified_at', $today)
            ->count();

        $pendingCheckout = AccessLog::where('estate_id', $estateId)
            ->whereNull('checked_out_at')
            ->whereHas('accessCode', function ($q) {
                $q->where('expires_at', '<', now());
            })
            ->count();

        $deniedEntries = AccessCode::where('estate_id', $estateId)
            ->where('status', 'revoked')
            ->count();

        $durations = AccessLog::where('estate_id', $estateId)
            ->whereNotNull('checked_out_at')
            ->selectRaw('TIMESTAMPDIFF(MINUTE, verified_at, checked_out_at) as duration')
            ->pluck('duration');
        $avgDuration = $durations->count() > 0 ? round($durations->average()) : 0;

        $now = Carbon::now();
        $todayStart = Carbon::today();
        $todayEnd = Carbon::today()->endOfDay();

        $expectedToday = AccessCode::where('estate_id', $estateId)
            ->whereIn('status', ['active', 'scheduled'])
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            })
            ->where(function ($q) use ($todayStart, $todayEnd) {
                $q->whereBetween('starts_at', [$todayStart, $todayEnd])
                    ->orWhere(function ($sq) use ($todayStart, $todayEnd) {
                        $sq->whereNull('starts_at')
                            ->whereBetween('created_at', [$todayStart, $todayEnd]);
                    });
            })
            ->count();

        $totalChecked = AccessLog::where('estate_id', $estateId)->count();

        return [
            'currentlyInside' => $currentlyInside,
            'visitorsToday' => $visitorsToday,
            'pendingCheckout' => $pendingCheckout,
            'deniedEntries' => $deniedEntries,
            'avgDuration' => $avgDuration,
            'expectedToday' => $expectedToday,
            'totalChecked' => $totalChecked,
        ];
    }

    /**
     * @return array{trend: list<array{date: string, count: int}>, peakHours: list<array{label: string, value: int}>, mostVisited: list<array{name: string, count: int}>}
     */
    private function buildAnalytics(int $estateId): array
    {
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $trend[] = [
                'date' => $date->format('D, M j'),
                'count' => AccessLog::where('estate_id', $estateId)->whereDate('verified_at', $date)->count(),
            ];
        }

        $peakHours = AccessLog::where('estate_id', $estateId)
            ->selectRaw('HOUR(verified_at) as hour, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(fn ($item) => [
                'label' => sprintf('%02d:00', $item->hour),
                'value' => $item->count,
            ])
            ->toArray();

        $mostVisited = User::query()
            ->whereIn('id', function ($query) use ($estateId) {
                $query->select('user_id')
                    ->from('access_codes')
                    ->whereIn('id', function ($subQuery) use ($estateId) {
                        $subQuery->select('access_code_id')
                            ->from('access_logs')
                            ->where('estate_id', $estateId);
                    });
            })
            ->role('resident')
            ->withCount(['accessCodes as visits_count' => function ($query) use ($estateId) {
                $query->whereHas('accessLogs', function ($sq) use ($estateId) {
                    $sq->where('estate_id', $estateId);
                });
            }])
            ->orderByDesc('visits_count')
            ->limit(5)
            ->get(['id', 'name'])
            ->map(fn ($u) => [
                'name' => $u->name,
                'count' => $u->visits_count,
            ])
            ->toArray();

        return [
            'trend' => $trend,
            'peakHours' => $peakHours,
            'mostVisited' => $mostVisited,
        ];
    }

    /**
     * @return list<array{id: int, type: string, message: string, time: string}>
     */
    private function buildLiveFeed(int $estateId): array
    {
        return AccessLog::where('estate_id', $estateId)
            ->with(['accessCode.user'])
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                $visitor = $log->accessCode?->visitor_name ?? 'Visitor';
                $host = $log->accessCode?->user?->name ?? 'Resident';
                $type = $log->checked_out_at ? 'exit' : 'entry';
                $time = $log->checked_out_at ?? $log->verified_at;

                return [
                    'id' => $log->id,
                    'type' => $type,
                    'message' => $type === 'exit'
                        ? "{$visitor} checked out of the estate"
                        : "{$visitor} arrived to visit {$host}",
                    'time' => $time->diffForHumans(),
                ];
            })
            ->toArray();
    }

    private function hostsForFilters(Estate $estate)
    {
        return User::query()
            ->whereIn('id', function ($query) use ($estate) {
                $query->select('user_id')
                    ->from('access_codes')
                    ->whereIn('id', function ($subQuery) use ($estate) {
                        $subQuery->select('access_code_id')
                            ->from('access_logs')
                            ->where('estate_id', $estate->id);
                    });
            })
            ->role('resident')
            ->whereHas('estates', function ($query) use ($estate) {
                $query->where('estates.id', $estate->id);
            })
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();
    }

    private function securityOfficersForFilters(Estate $estate)
    {
        return User::query()
            ->role('security')
            ->whereHas('estates', function ($query) use ($estate) {
                $query->where('estates.id', $estate->id);
            })
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();
    }

    private function buildCurrentlyInsideList(int $estateId): array
    {
        return AccessLog::where('estate_id', $estateId)
            ->whereNull('checked_out_at')
            ->with(['accessCode.user.profile', 'verifier:id,name'])
            ->orderByDesc('verified_at')
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'code' => $log->accessCode?->code,
                'visitor' => [
                    'name' => $log->accessCode?->visitor_name ?? 'Visitor',
                    'phone' => $log->accessCode?->visitor_phone ?? 'N/A',
                    'type' => $log->accessCode?->type,
                ],
                'host' => [
                    'id' => $log->accessCode?->user_id,
                    'name' => $log->accessCode?->user?->name ?? 'N/A',
                    'unit' => $log->accessCode?->user?->profile?->unit_number ?? 'N/A',
                    'address' => $log->accessCode?->user?->profile?->address,
                ],
                'purpose' => $log->accessCode?->purpose ?? 'General Visit',
                'verified_at' => $log->verified_at->format('g:i A'),
                'verified_at_human' => $log->verified_at->diffForHumans(),
                'duration_minutes' => now()->diffInMinutes($log->verified_at),
                'is_overstayed' => $log->accessCode?->expires_at ? $log->accessCode->expires_at->isPast() : false,
                'gate' => $log->meta['gate'] ?? 'Main Gate',
                'vehicle' => $log->vehicle_make ? [
                    'make' => $log->vehicle_make,
                    'model' => $log->vehicle_model,
                    'plate' => $log->vehicle_plate_number,
                ] : null,
            ])
            ->toArray();
    }

    private function buildExpectedArrivals(int $estateId): array
    {
        $now = Carbon::now();
        $todayStart = Carbon::today();
        $todayEnd = Carbon::today()->endOfDay();

        return AccessCode::where('estate_id', $estateId)
            ->whereIn('status', ['active', 'scheduled'])
            ->whereDoesntHave('accessLogs', function ($q) {
                $q->whereNull('checked_out_at');
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            })
            ->where(function ($q) use ($todayStart, $todayEnd) {
                $q->whereBetween('starts_at', [$todayStart, $todayEnd])
                    ->orWhere(function ($sq) use ($todayStart, $todayEnd) {
                        $sq->whereNull('starts_at')
                            ->whereBetween('created_at', [$todayStart, $todayEnd]);
                    });
            })
            ->with(['user.profile'])
            ->orderBy('starts_at')
            ->limit(15)
            ->get()
            ->map(fn ($code) => [
                'id' => $code->id,
                'code' => $code->code,
                'visitor_name' => $code->visitor_name ?? 'Guest',
                'visitor_phone' => $code->visitor_phone ?? 'N/A',
                'purpose' => $code->purpose ?? 'General Visit',
                'type' => $code->type,
                'host_name' => $code->user?->name ?? 'Host',
                'host_unit' => $code->user?->profile?->unit_number ?? 'Main',
                'expected_time' => $code->starts_at ? $code->starts_at->format('g:i A') : $code->created_at->format('g:i A'),
                'expires_at' => $code->expires_at?->format('g:i A'),
            ])
            ->toArray();
    }

    private function buildAttentionItems(int $estateId): array
    {
        $items = [];

        $overstayedLogs = AccessLog::where('estate_id', $estateId)
            ->whereNull('checked_out_at')
            ->whereHas('accessCode', fn ($q) => $q->where('expires_at', '<', now()))
            ->with(['accessCode.user'])
            ->limit(5)
            ->get();

        foreach ($overstayedLogs as $log) {
            $visitor = $log->accessCode?->visitor_name ?? 'Visitor';
            $host = $log->accessCode?->user?->name ?? 'Host';
            $items[] = [
                'id' => 'overstay-'.$log->id,
                'type' => 'overstay',
                'severity' => 'high',
                'title' => "Overstay Alert: {$visitor}",
                'description' => "Inside with {$host}. Pass expired ".($log->accessCode?->expires_at?->diffForHumans() ?? 'recently'),
                'action_label' => 'Check Out',
                'log_id' => $log->id,
            ];
        }

        $revokedCount = AccessCode::where('estate_id', $estateId)
            ->where('status', 'revoked')
            ->whereDate('updated_at', Carbon::today())
            ->count();

        if ($revokedCount > 0) {
            $items[] = [
                'id' => 'revoked-today',
                'type' => 'security',
                'severity' => 'medium',
                'title' => "{$revokedCount} Pass".($revokedCount > 1 ? 'es' : '').' Denied / Revoked Today',
                'description' => 'Security intervention or host revocation flagged.',
                'action_label' => 'View Log',
            ];
        }

        return $items;
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @param  T  $fallback
     * @return T
     */
    private function safe(callable $callback, mixed $fallback): mixed
    {
        try {
            return $callback();
        } catch (Throwable $e) {
            report($e);

            return $fallback;
        }
    }
}
