<?php

namespace App\Services\Organization;

use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\Scopes\ZoneScope;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ArrivalService
{
    /**
     * Query arrivals currently on site for an organization.
     */
    public function getActiveArrivals(EstateOrganization $organization, array $filters = []): Collection
    {
        $query = AccessLog::withoutGlobalScope(ZoneScope::class)
            ->where('organization_id', $organization->id)
            ->whereNull('checked_out_at')
            ->with(['accessCode.organizationMember', 'verifier:id,name'])
            ->latest('verified_at');

        if (! empty($filters['search'])) {
            $term = trim($filters['search']);
            $query->where(function (Builder $q) use ($term) {
                $q->where('meta->visitor_name', 'like', "%{$term}%")
                    ->orWhere('meta->tag', 'like', "%{$term}%")
                    ->orWhere('vehicle_plate_number', 'like', "%{$term}%");
            });
        }

        if (! empty($filters['admission_basis'])) {
            $query->where('meta->admission_basis', $filters['admission_basis']);
        }

        return $query->get()->map(fn (AccessLog $log) => $this->transformArrival($log, $organization));
    }

    /**
     * Query paginated arrival history for an organization.
     */
    public function getArrivalHistory(EstateOrganization $organization, array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        $query = AccessLog::withoutGlobalScope(ZoneScope::class)
            ->where('organization_id', $organization->id)
            ->with(['accessCode.organizationMember', 'verifier:id,name', 'checkoutVerifier:id,name'])
            ->latest('verified_at');

        if (! empty($filters['search'])) {
            $term = trim($filters['search']);
            $query->where(function (Builder $q) use ($term) {
                $q->where('meta->visitor_name', 'like', "%{$term}%")
                    ->orWhere('meta->tag', 'like', "%{$term}%")
                    ->orWhere('vehicle_plate_number', 'like', "%{$term}%");
            });
        }

        if (! empty($filters['date'])) {
            $query->whereDate('verified_at', $filters['date']);
        }

        if (! empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->whereNull('checked_out_at');
            } elseif ($filters['status'] === 'checked_out') {
                $query->whereNotNull('checked_out_at');
            }
        }

        return $query->paginate($perPage)->through(fn (AccessLog $log) => $this->transformArrival($log, $organization));
    }

    /**
     * Get real-time summary statistics for an organization.
     */
    public function getMetrics(EstateOrganization $organization): array
    {
        $activeQuery = AccessLog::withoutGlobalScope(ZoneScope::class)
            ->where('organization_id', $organization->id)
            ->whereNull('checked_out_at');

        $currentlyInside = (clone $activeQuery)->count();

        $todayEntries = AccessLog::withoutGlobalScope(ZoneScope::class)
            ->where('organization_id', $organization->id)
            ->whereDate('verified_at', now()->toDateString())
            ->count();

        return [
            'currently_inside' => $currentlyInside,
            'today_entries' => $todayEntries,
        ];
    }

    /**
     * Transform an AccessLog into an enriched payload.
     */
    public function transformArrival(AccessLog $log, ?EstateOrganization $organization = null): array
    {
        $meta = $log->meta ?? [];
        $entryTime = $log->verified_at ? CarbonImmutable::instance($log->verified_at) : null;

        return [
            'id' => $log->id,
            'tag' => $meta['tag'] ?? null,
            'visitor_name' => $meta['visitor_name'] ?? 'Visitor',
            'admission_basis' => $meta['admission_basis'] ?? ($meta['entry_type'] ?? 'unknown'),
            'vehicle_plate_number' => $log->vehicle_plate_number,
            'vehicle_make' => $log->vehicle_make,
            'vehicle_model' => $log->vehicle_model,
            'entry_point' => $log->entry_point ?? ($meta['entry_point'] ?? null),
            'verified_at' => $entryTime?->toISOString(),
            'verified_at_human' => $entryTime?->diffForHumans(),
            'checked_out_at' => $log->checked_out_at?->toISOString(),
            'checked_out_at_human' => $log->checked_out_at?->diffForHumans(),
            'verified_by' => $log->verifier ? ['id' => $log->verifier->id, 'name' => $log->verifier->name] : null,
            'member' => $log->accessCode?->organizationMember ? [
                'id' => $log->accessCode->organizationMember->id,
                'name' => $log->accessCode->organizationMember->name,
                'identifier' => $log->accessCode->organizationMember->identifier,
                'category' => $log->accessCode->organizationMember->category,
            ] : null,
        ];
    }
}
