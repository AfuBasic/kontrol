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
        $settings = EstateSettings::where('estate_id', $estateId)->first();

        return (bool) ($settings?->visitor_checkout_enabled ?? false);
    }

    /**
     * Base query for active visits (checked in, not checked out) in an estate.
     *
     * @return Builder<AccessLog>
     */
    public function baseActiveQuery(int $estateId): Builder
    {
        return AccessLog::withoutGlobalScopes()
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
                })
                ->orWhere('vehicle_plate_number', 'like', "%{$search}%")
                ->orWhere('meta->tag', 'like', "%{$search}%")
                ->orWhere('meta->visitor_name', 'like', "%{$search}%")
                ->orWhere('meta->organization_name', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('verified_at', 'asc') // Oldest first for security queue
            ->get()
            ->map(fn (AccessLog $log) => $this->transformActiveVisit($log, $enforceSameGate, $currentGate, $settings));
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
     * Resolve the display name of an entry gate truthfully based on estate configuration.
     *
     * - If entryPoint is recorded, display it directly.
     * - If entryPoint is null and the estate has exactly 1 configured gate, return that gate name.
     * - If entryPoint is null and the estate has multiple gates (or none), return 'Gate not recorded'.
     */
    public function resolveGateDisplay(?string $entryPoint, ?EstateSettings $settings): string
    {
        $trimmed = trim((string) $entryPoint);
        if ($trimmed !== '') {
            return $trimmed;
        }

        $configuredGates = array_values(array_filter($settings?->entry_points ?? []));
        if (count($configuredGates) === 1) {
            return (string) $configuredGates[0];
        }

        return 'Gate not recorded';
    }

    /**
     * Transform an AccessLog into a unified active visit shape.
     *
     * @return array<string, mixed>
     */
    public function transformActiveVisit(
        AccessLog $log,
        bool $enforceSameGate = false,
        ?string $currentGuardGate = null,
        ?EstateSettings $settings = null
    ): array {
        $code = $log->accessCode;
        $user = $code?->user;
        $profile = $user?->profile;

        $rawEntryPoint = $log->entry_point ?? $log->meta['entry_point'] ?? $log->meta['gate'] ?? null;
        $estateSettings = $settings ?? EstateSettings::forEstate($log->estate_id);
        $resolvedGate = $this->resolveGateDisplay($rawEntryPoint, $estateSettings);

        $verifiedAt = $log->verified_at;
        $now = Carbon::now();

        $durationMinutes = $verifiedAt ? (int) $now->diffInMinutes($verifiedAt) : 0;
        $isOverstayed = false;

        if ($code && $code->expires_at && $now->isAfter($code->expires_at)) {
            $isOverstayed = true;
        }

        $canCheckout = true;
        $checkoutConstraint = null;

        // Gate checkout enforcement:
        // If same-gate is enforced and this log has an entry gate recorded
        if ($enforceSameGate && $rawEntryPoint) {
            if (! $currentGuardGate) {
                $canCheckout = false;
                $checkoutConstraint = "Must check out at {$resolvedGate}";
            } elseif (strcasecmp(trim($rawEntryPoint), trim($currentGuardGate)) !== 0) {
                $canCheckout = false;
                $checkoutConstraint = "Must check out at {$resolvedGate}";
            }
        }

        $metaEntryType = $log->meta['entry_type'] ?? null;
        $isQuickEntry = $metaEntryType === 'quick_entry';
        $tag = $log->meta['tag'] ?? null;
        $orgName = $log->meta['organization_name'] ?? null;

        // Determine clear entry type display label and slug
        if ($isQuickEntry) {
            $entryTypeSlug = 'quick_entry';
            $entryTypeLabel = 'Quick Entry';
        } elseif ($code && $code->type === 'organization') {
            $entryTypeSlug = 'organization_credential';
            $entryTypeLabel = 'Organization Access';
        } else {
            $entryTypeSlug = 'visitor_pass';
            $entryTypeLabel = 'Visitor Pass';
        }

        // Clean visitor name (avoid "Unknown User" / "Guest Visitor")
        $rawVisitorName = $isQuickEntry ? ($log->meta['visitor_name'] ?? null) : ($code?->visitor_name ?? null);
        if ($isQuickEntry && (! $rawVisitorName || $rawVisitorName === "Visitor ({$orgName})")) {
            $visitorName = 'Walk-in visitor';
            $hasCapturedIdentity = false;
        } elseif (! empty($rawVisitorName)) {
            $visitorName = $rawVisitorName;
            $hasCapturedIdentity = true;
        } else {
            $visitorName = 'Walk-in visitor';
            $hasCapturedIdentity = false;
        }

        // Destination presentation
        $destinationName = $isQuickEntry ? $orgName : ($user?->name ?? 'Resident');

        return [
            'id' => $log->id,
            'access_log_id' => $log->id,
            'code' => $code?->code ?? $tag,
            'tag' => $tag,
            'is_quick_entry' => $isQuickEntry,
            'entry_type' => $entryTypeSlug,
            'entry_type_label' => $entryTypeLabel,
            'pass_uuid' => $code?->pass_uuid,
            'has_captured_identity' => $hasCapturedIdentity,
            'destination_name' => $destinationName,
            'visitor' => [
                'name' => $visitorName,
                'phone' => $code?->visitor_phone,
                'type' => $isQuickEntry ? 'quick_entry' : $code?->type,
            ],
            'host' => [
                'id' => $user?->id,
                'name' => $destinationName,
                'unit' => $profile?->unit_number,
                'address' => $profile?->address,
            ],
            'purpose' => $isQuickEntry ? ($orgName ? "Visit to {$orgName}" : 'Quick Entry') : $code?->purpose,
            'verified_at' => $verifiedAt ? $verifiedAt->format('M j, Y g:i A') : null,
            'verified_at_iso' => $verifiedAt ? $verifiedAt->toIso8601String() : null,
            'verified_at_time' => $verifiedAt ? $verifiedAt->format('g:i A') : null,
            'verified_at_human' => $verifiedAt ? $verifiedAt->diffForHumans() : null,
            'verifier_name' => $log->verifier?->name ?? 'Security Guard',
            'entry_point' => $resolvedGate,
            'raw_entry_point' => $rawEntryPoint,
            'gate' => $resolvedGate,
            'duration_minutes' => $durationMinutes,
            'is_overstayed' => $isOverstayed,
            'outside_hours' => (bool) ($log->meta['outside_hours'] ?? false),
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
            'organization_id' => $log->organization_id,
            'confirmation_state' => $log->confirmationState(),
            'confirmed_at' => $log->confirmed_at?->toIso8601String(),
        ];
    }
}
