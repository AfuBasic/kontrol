<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VisitorLogController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of visitor access logs.
     */
    public function index(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();

        $filters = $request->only(['search', 'date', 'vehicle_plate', 'host_id']);

        $logs = AccessLog::query()
            ->where('estate_id', $estate->id)
            ->with(['accessCode.user.profile', 'verifier:id,name'])
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
                'vehicle' => $log->vehicle_make ? [
                    'make' => $log->vehicle_make,
                    'model' => $log->vehicle_model,
                    'plate' => $log->vehicle_plate_number,
                ] : null,
            ]);

        // Get unique hosts (residents) from the estate who have visitor history
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
            ->role('resident') // Ensure they have the resident role
            ->whereHas('estates', function ($query) use ($estate) {
                $query->where('estates.id', $estate->id); // Ensure they belong to this estate
            })
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        return Inertia::render('Admin/Visitors/Index', [
            'logs' => $logs,
            'filters' => $filters,
            'hosts' => $hosts,
        ]);
    }
}
