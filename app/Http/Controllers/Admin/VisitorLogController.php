<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\User;
use App\Services\EstateContextService;
use App\Services\Resident\AccessCodeService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
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
     * Display the admin Visitors page (on-property roster, activity timeline).
     */
    public function index(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();
        $filters = $request->only([
            'search',
            'date',
            'vehicle_plate',
            'host_id',
            'status',
            'gate',
            'verifier_id',
            'sort',
            'direction',
            'view',
        ]);

        $filters['sort'] = $this->normalizeSort($filters['sort'] ?? null);
        $filters['direction'] = $this->normalizeDirection($filters['direction'] ?? null);
        $filters['view'] = in_array($filters['view'] ?? null, ['activity', 'table'], true)
            ? $filters['view']
            : 'activity';

        $checkoutEnabled = (bool) ($estate->settings?->visitor_checkout_enabled ?? false);

        return Inertia::render('Admin/Visitors/Index', [
            'logs' => Inertia::scroll(fn () => $this->paginatedLogs($estate->id, $filters)),
            'filters' => (object) $filters,
            'hosts' => Inertia::defer(fn () => $this->hostsForFilters($estate)),
            'securityOfficers' => Inertia::defer(fn () => $this->securityOfficersForFilters($estate)),
            'checkoutEnabled' => $checkoutEnabled,
            'currentlyInsideList' => $checkoutEnabled
                ? $this->safe(fn () => $this->buildCurrentlyInsideList($estate->id), [])
                : [],
            'expectedTodayCount' => $this->safe(fn () => $this->buildExpectedTodayCount($estate->id), 0),
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
    public function calendarEvents(Request $request): JsonResponse
    {
        $estate = $this->estateContext->getEstate();
        $startDate = $request->input('start') ? Carbon::parse($request->input('start')) : now()->startOfMonth();
        $endDate = $request->input('end') ? Carbon::parse($request->input('end')) : now()->endOfMonth();

        $accessCodeService = app(AccessCodeService::class);

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
        $sort = $this->normalizeSort($filters['sort'] ?? null);
        $direction = $this->normalizeDirection($filters['direction'] ?? null);

        $query = AccessLog::query()
            ->where('access_logs.estate_id', $estateId)
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
                $query->whereDate('access_logs.verified_at', $date);
            })
            ->when($filters['vehicle_plate'] ?? null, function ($query, $plate) {
                $query->where('access_logs.vehicle_plate_number', 'like', "%{$plate}%");
            })
            ->when($filters['host_id'] ?? null, function ($query, $hostId) {
                $query->whereHas('accessCode', function ($q) use ($hostId) {
                    $q->where('user_id', $hostId);
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                if ($status === 'inside') {
                    $query->whereNull('access_logs.checked_out_at');
                } elseif ($status === 'checked_out') {
                    $query->whereNotNull('access_logs.checked_out_at');
                }
            })
            ->when($filters['verifier_id'] ?? null, function ($query, $verifierId) {
                $query->where('access_logs.verified_by', $verifierId);
            });

        $this->applyLogSort($query, $sort, $direction);

        return $query
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($log) => $this->transformLog($log));
    }

    /**
     * @param  Builder<AccessLog>  $query
     */
    private function applyLogSort($query, string $sort, string $direction): void
    {
        match ($sort) {
            'visitor' => $query
                ->leftJoin('access_codes as ac_sort', 'access_logs.access_code_id', '=', 'ac_sort.id')
                ->orderBy('ac_sort.visitor_name', $direction)
                ->orderByDesc('access_logs.verified_at')
                ->select('access_logs.*'),
            'host' => $query
                ->leftJoin('access_codes as ac_sort', 'access_logs.access_code_id', '=', 'ac_sort.id')
                ->leftJoin('users as host_sort', 'ac_sort.user_id', '=', 'host_sort.id')
                ->orderBy('host_sort.name', $direction)
                ->orderByDesc('access_logs.verified_at')
                ->select('access_logs.*'),
            'duration' => $query
                ->orderByRaw(
                    'TIMESTAMPDIFF(MINUTE, access_logs.verified_at, COALESCE(access_logs.checked_out_at, NOW())) '.$direction
                )
                ->orderByDesc('access_logs.verified_at'),
            'checked_out_at' => $query
                ->orderBy('access_logs.checked_out_at', $direction)
                ->orderByDesc('access_logs.verified_at'),
            'status' => $query
                ->orderByRaw('access_logs.checked_out_at IS NULL '.($direction === 'asc' ? 'asc' : 'desc'))
                ->orderByDesc('access_logs.verified_at'),
            default => $query
                ->orderBy('access_logs.verified_at', $direction)
                ->orderByDesc('access_logs.id'),
        };
    }

    private function normalizeSort(?string $sort): string
    {
        $allowed = ['verified_at', 'visitor', 'host', 'duration', 'checked_out_at', 'status'];

        return in_array($sort, $allowed, true) ? $sort : 'verified_at';
    }

    private function normalizeDirection(?string $direction): string
    {
        return strtolower((string) $direction) === 'asc' ? 'asc' : 'desc';
    }

    /**
     * @return array<string, mixed>
     */
    private function transformLog(AccessLog $log): array
    {
        $code = $log->accessCode;
        $issuedAt = $code?->created_at;
        $isOverstayed = $code?->expires_at ? $code->expires_at->isPast() && $log->checked_out_at === null : false;

        return [
            'id' => $log->id,
            'code' => $code?->code,
            'visitor' => [
                'name' => $code?->visitor_name ?? 'Visitor',
                'phone' => $code?->visitor_phone,
                'type' => $code?->type,
            ],
            'host' => [
                'id' => $code?->user_id,
                'name' => $code?->user?->name ?? 'Host',
                'unit' => $code?->user?->profile?->unit_number,
                'address' => $code?->user?->profile?->address,
            ],
            'purpose' => $code?->purpose,
            'issued_at' => $issuedAt?->format('M j, Y g:i A'),
            'issued_at_iso' => $issuedAt?->toIso8601String(),
            'issued_by' => $code?->user?->name ?? 'Resident',
            'verified_at' => $log->verified_at->format('M j, Y g:i A'),
            'verified_at_iso' => $log->verified_at->toIso8601String(),
            'verified_at_human' => $log->verified_at->diffForHumans(),
            'verified_at_time' => $log->verified_at->format('g:i A'),
            'verifier_name' => $log->verifier?->name ?? 'Security',
            'checked_out_at' => $log->checked_out_at?->format('M j, Y g:i A'),
            'checked_out_at_iso' => $log->checked_out_at?->toIso8601String(),
            'checked_out_at_human' => $log->checked_out_at?->diffForHumans(),
            'checked_out_at_time' => $log->checked_out_at?->format('g:i A'),
            'checkout_verifier_name' => $log->checkoutVerifier?->name,
            'duration_minutes' => $log->checked_out_at
                ? (int) $log->checked_out_at->diffInMinutes($log->verified_at)
                : (int) now()->diffInMinutes($log->verified_at),
            'is_overstayed' => $isOverstayed,
            'code_expires_at' => $code?->expires_at?->format('M j, Y g:i A'),
            'gate' => $log->entry_point ?? $log->meta['entry_point'] ?? $log->meta['gate'] ?? 'Main Entrance',
            'entry_point' => $log->entry_point ?? $log->meta['entry_point'] ?? $log->meta['gate'] ?? 'Main Entrance',
            'exit_point' => $log->checked_out_at ? ($log->meta['exit_point'] ?? $log->entry_point ?? 'Main Entrance') : null,
            'vehicle' => $log->vehicle_make ? [
                'make' => $log->vehicle_make,
                'model' => $log->vehicle_model,
                'plate' => $log->vehicle_plate_number,
            ] : null,
        ];
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

    /**
     * @return list<array<string, mixed>>
     */
    private function buildCurrentlyInsideList(int $estateId): array
    {
        return AccessLog::where('estate_id', $estateId)
            ->whereNull('checked_out_at')
            ->with(['accessCode.user.profile', 'verifier:id,name'])
            ->orderByDesc('verified_at')
            ->get()
            ->map(fn ($log) => $this->transformLog($log))
            ->toArray();
    }

    private function buildExpectedTodayCount(int $estateId): int
    {
        $now = Carbon::now();
        $todayStart = Carbon::today();
        $todayEnd = Carbon::today()->endOfDay();

        return AccessCode::where('estate_id', $estateId)
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
