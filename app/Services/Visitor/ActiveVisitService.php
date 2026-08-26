<?php

namespace App\Services\Visitor;

use App\Models\AccessLog;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ActiveVisitService
{
    public function __construct(
        protected CheckpointClaimService $checkpointClaimService
    ) {}

    /**
     * Check whether checkout monitoring is enabled for the estate.
     */
    public function isCheckoutMonitoringEnabled(int $estateId): bool
    {
        $settings = EstateSettings::forEstate($estateId);

        return (bool) ($settings->visitor_checkout_enabled ?? false);
    }

    /**
     * Base query for active visits (checked in, not checked out) in an estate.
     *
     * @return Builder<AccessLog>
     */
    public function baseActiveQuery(int $estateId): Builder
    {
        return AccessLog::withoutGlobalScope(ZoneScope::class)
            ->where('access_logs.estate_id', $estateId)
            ->whereNull('access_logs.checked_out_at')
            ->whereNotNull('access_logs.verified_at');
    }

    /**
     * Get active visits for a specific resident host.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getResidentActiveVisits(int $estateId, int $residentId): Collection
    {
        if (! $this->isCheckoutMonitoringEnabled($estateId)) {
            return collect();
        }

        return $this->baseActiveQuery($estateId)
            ->whereHas('accessCode', function (Builder $query) use ($residentId) {
                $query->where('user_id', $residentId);
            })
            ->with(['accessCode.user.profile', 'verifier:id,name'])
            ->orderByDesc('verified_at')
            ->get()
            ->map(fn (AccessLog $log) => $this->transformActiveVisit($log));
    }

    /**
     * Count active visits for a specific resident host.
     */
    public function countResidentActiveVisits(int $estateId, int $residentId): int
    {
        if (! $this->isCheckoutMonitoringEnabled($estateId)) {
            return 0;
        }

        return $this->baseActiveQuery($estateId)
            ->whereHas('accessCode', function (Builder $query) use ($residentId) {
                $query->where('user_id', $residentId);
            })
            ->count();
    }

    /**
     * Get paginated active visits for estate admin with optional filtering.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<array<string, mixed>>|Collection<int, array<string, mixed>>
     */
    public function getAdminActiveVisits(int $estateId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        if (! $this->isCheckoutMonitoringEnabled($estateId)) {
            return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage);
        }

        $query = $this->baseActiveQuery($estateId)
            ->with(['accessCode.user.profile', 'verifier:id,name']);

        if (! empty($filters['search'])) {
            $search = (string) $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->whereHas('accessCode', function (Builder $sq) use ($search) {
                    $sq->where('visitor_name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('visitor_phone', 'like', "%{$search}%")
                        ->orWhereHas('user', function (Builder $uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%");
                        });
                })->orWhere('vehicle_plate_number', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['zone_id'])) {
            $query->where('zone_id', $filters['zone_id']);
        }

        if (! empty($filters['entry_point'])) {
            $query->where('entry_point', $filters['entry_point']);
        }

        return $query->orderByDesc('verified_at')
            ->paginate($perPage)
            ->through(fn (AccessLog $log) => $this->transformActiveVisit($log));
    }

    /**
     * Get list of active visits for security queue.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getSecurityActiveVisits(int $estateId, ?User $guard = null, ?string $search = null): Collection
    {
        if (! $this->isCheckoutMonitoringEnabled($estateId)) {
            return collect();
        }

        $settings = EstateSettings::forEstate($estateId);
        $enforceSameGate = (bool) ($settings->entry_point_checkout_enforced ?? false);
        $currentGate = $guard ? $this->checkpointClaimService->getCurrentCheckpoint($estateId, $guard) : null;

        $query = $this->baseActiveQuery($estateId)
            ->with(['accessCode.user.profile', 'verifier:id,name']);

        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->whereHas('accessCode', function (Builder $sq) use ($search) {
                    $sq->where('visitor_name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('visitor_phone', 'like', "%{$search}%")
                        ->orWhereHas('user', function (Builder $uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%");
                        });
                })->orWhere('vehicle_plate_number', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('verified_at', 'asc') // Oldest first for security queue
            ->get()
            ->map(fn (AccessLog $log) => $this->transformActiveVisit($log, $enforceSameGate, $currentGate));
    }

    /**
     * Count total active visits in an estate.
     */
    public function countEstateActiveVisits(int $estateId): int
    {
        if (! $this->isCheckoutMonitoringEnabled($estateId)) {
            return 0;
        }

        return $this->baseActiveQuery($estateId)->count();
    }

    /**
     * Transform an AccessLog into a unified active visit shape.
     *
     * @return array<string, mixed>
     */
    public function transformActiveVisit(
        AccessLog $log,
        bool $enforceSameGate = false,
        ?string $currentGuardGate = null
    ): array {
        $code = $log->accessCode;
        $user = $code?->user;
        $profile = $user?->profile;

        $entryPoint = $log->entry_point ?? $log->meta['entry_point'] ?? $log->meta['gate'] ?? 'Main Entrance';
        $verifiedAt = $log->verified_at;
        $now = Carbon::now();

        $durationMinutes = $verifiedAt ? (int) $now->diffInMinutes($verifiedAt) : 0;
        $isOverstayed = false;

        if ($code && $code->expires_at && $now->isAfter($code->expires_at)) {
            $isOverstayed = true;
        }

        $canCheckout = true;
        $checkoutConstraint = null;

        if ($enforceSameGate && $entryPoint) {
            if (! $currentGuardGate) {
                $canCheckout = false;
                $checkoutConstraint = "Requires operating at '{$entryPoint}'. Please claim this checkpoint.";
            } elseif (strcasecmp(trim($entryPoint), trim($currentGuardGate)) !== 0) {
                $canCheckout = false;
                $checkoutConstraint = "Can only check out from '{$entryPoint}'. You are at '{$currentGuardGate}'.";
            }
        }

        return [
            'id' => $log->id,
            'access_log_id' => $log->id,
            'code' => $code?->code,
            'pass_uuid' => $code?->pass_uuid,
            'visitor' => [
                'name' => $code?->visitor_name ?? 'Visitor',
                'phone' => $code?->visitor_phone,
                'type' => $code?->type,
            ],
            'host' => [
                'id' => $user?->id,
                'name' => $user?->name ?? 'Resident',
                'unit' => $profile?->unit_number,
                'address' => $profile?->address,
            ],
            'purpose' => $code?->purpose,
            'verified_at' => $verifiedAt ? $verifiedAt->format('M j, Y g:i A') : null,
            'verified_at_iso' => $verifiedAt ? $verifiedAt->toIso8601String() : null,
            'verified_at_time' => $verifiedAt ? $verifiedAt->format('g:i A') : null,
            'verified_at_human' => $verifiedAt ? $verifiedAt->diffForHumans() : null,
            'verifier_name' => $log->verifier?->name ?? 'Security',
            'entry_point' => $entryPoint,
            'gate' => $entryPoint,
            'duration_minutes' => $durationMinutes,
            'is_overstayed' => $isOverstayed,
            'code_expires_at' => $code?->expires_at?->format('M j, Y g:i A'),
            'code_expires_at_iso' => $code?->expires_at?->toIso8601String(),
            'code_type' => $code?->type,
            'vehicle' => $log->vehicle_make ? [
                'make' => $log->vehicle_make,
                'model' => $log->vehicle_model,
                'plate' => $log->vehicle_plate_number,
            ] : null,
            'can_checkout' => $canCheckout,
            'checkout_constraint' => $checkoutConstraint,
        ];
    }
}
