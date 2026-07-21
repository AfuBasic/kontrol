<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\User;
use App\Services\EstateContextService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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

        // Query Logs with filters
        $logsQuery = AccessLog::query()
            ->where('estate_id', $estate->id)
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
            ->orderByDesc('verified_at');

        $logs = $logsQuery->paginate(25)
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

        // Aggregate Metrics for Operations Center
        $currentlyInside = AccessLog::where('estate_id', $estate->id)
            ->whereNull('checked_out_at')
            ->count();

        $visitorsToday = AccessLog::where('estate_id', $estate->id)
            ->whereDate('verified_at', $today)
            ->count();

        $pendingCheckout = AccessLog::where('estate_id', $estate->id)
            ->whereNull('checked_out_at')
            ->whereHas('accessCode', function ($q) {
                $q->where('expires_at', '<', now());
            })
            ->count();

        $deniedEntries = AccessCode::where('estate_id', $estate->id)
            ->where('status', 'revoked')
            ->count();

        // Calculate average duration
        $durations = AccessLog::where('estate_id', $estate->id)
            ->whereNotNull('checked_out_at')
            ->selectRaw('TIMESTAMPDIFF(MINUTE, verified_at, checked_out_at) as duration')
            ->pluck('duration');
        $avgDuration = $durations->count() > 0 ? round($durations->average()) : 0;

        // Trend (7 Days)
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $trend[] = [
                'date' => $date->format('D, M j'),
                'count' => AccessLog::where('estate_id', $estate->id)->whereDate('verified_at', $date)->count(),
            ];
        }

        // Peak Hours (hourly distribution)
        $peakHours = AccessLog::where('estate_id', $estate->id)
            ->selectRaw('HOUR(verified_at) as hour, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(fn ($item) => [
                'label' => sprintf('%02d:00', $item->hour),
                'value' => $item->count,
            ])
            ->toArray();

        // Most Visited Residents
        $mostVisited = User::query()
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
            ->withCount(['accessCodes as visits_count' => function ($query) use ($estate) {
                $query->whereHas('accessLogs', function ($sq) use ($estate) {
                    $sq->where('estate_id', $estate->id);
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

        // Live Feed
        $liveFeed = AccessLog::where('estate_id', $estate->id)
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

        // Hosts list for filters
        $hosts = User::query()
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

        // Security Officers list for filters
        $securityOfficers = User::query()
            ->role('security')
            ->whereHas('estates', function ($query) use ($estate) {
                $query->where('estates.id', $estate->id);
            })
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        $checkoutEnabled = (bool) ($estate->settings?->visitor_checkout_enabled ?? false);

        return Inertia::render('Admin/Visitors/Index', [
            'logs' => Inertia::scroll(fn () => $logs),
            'filters' => $filters,
            'hosts' => $hosts,
            'securityOfficers' => $securityOfficers,
            'checkoutEnabled' => $checkoutEnabled,
            'metrics' => [
                'currentlyInside' => $currentlyInside,
                'visitorsToday' => $visitorsToday,
                'pendingCheckout' => $pendingCheckout,
                'deniedEntries' => $deniedEntries,
                'avgDuration' => $avgDuration,
            ],
            'analytics' => [
                'trend' => $trend,
                'peakHours' => $peakHours,
                'mostVisited' => $mostVisited,
            ],
            'liveFeed' => $liveFeed,
        ]);
    }
}
