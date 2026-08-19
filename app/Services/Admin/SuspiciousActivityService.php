<?php

namespace App\Services\Admin;

use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Models\SecurityEvent;
use App\Services\EstateContextService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SuspiciousActivityService
{
    public function __construct(protected EstateContextService $estateContext) {}

    /**
     * @return array{count: int, items: list<array<string, mixed>>}
     */
    public function dashboardSummary(int $limit = 3): array
    {
        $events = $this->baseQuery()
            ->requiringAttention()
            ->with('user:id,name,email')
            ->latest('detected_at')
            ->limit($limit)
            ->get();

        $count = $this->baseQuery()->requiringAttention()->count();

        return [
            'count' => $count,
            'items' => $events->map(fn (SecurityEvent $event): array => $this->listItem($event))->all(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function actionCenterItem(): ?array
    {
        $summary = $this->dashboardSummary(4);

        if ($summary['count'] === 0) {
            return null;
        }

        $hasHigh = collect($summary['items'])->contains(
            fn (array $item): bool => ($item['severity'] ?? '') === SecurityEventSeverity::High->value
        );

        $count = $summary['count'];

        return [
            'id' => 'suspicious_activity',
            'type' => 'suspicious_activity',
            'title' => 'Suspicious Activity',
            'desc' => $count === 1
                ? '1 security event involving an estate member requires attention.'
                : "{$count} security events involving estate members require attention.",
            'count' => $count,
            'severity' => $hasHigh ? 'critical' : 'warning',
            'actionLabel' => 'Review Activity',
            'actionUrl' => route('admin.suspicious-activity.index', ['attention' => 'attention']),
            'previews' => collect($summary['items'])->map(fn (array $item): array => [
                'id' => $item['id'],
                'title' => $item['type_label'],
                'subtitle' => $item['person_name'] ?? 'Unknown member',
                'context' => $item['detected_at']
                    ? Carbon::parse($item['detected_at'])->diffForHumans()
                    : 'Recently',
            ])->all(),
        ];
    }

    /**
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->baseQuery()->with('user:id,name,email')->latest('detected_at');

        $this->applyFilters($query, $filters);

        return $query->paginate(20)->through(fn (SecurityEvent $event): array => $this->listItem($event));
    }

    /**
     * @return array<string, mixed>
     */
    public function details(SecurityEvent $event): array
    {
        $event->load(['user:id,name,email']);

        return [
            'id' => $event->ulid,
            'type' => $event->type->value,
            'type_label' => $event->type->label(),
            'person' => [
                'name' => $event->user->name,
                'email' => $event->user->email,
            ],
            'severity' => $event->severity->value,
            'severity_label' => $event->severity->label(),
            'status' => $event->status->value,
            'status_label' => $event->status->label(),
            'device' => $event->display_name,
            'approximate_location' => $event->approximate_location,
            'detected_at' => $event->detected_at?->toIso8601String(),
            'resolved_at' => $event->resolved_at?->toIso8601String(),
            'resolution' => $event->resolution,
            'reviewed_at' => $event->reviewed_at?->toIso8601String(),
            'timeline' => collect($event->timeline ?? [])->map(fn (array $entry): array => [
                'at' => $entry['at'] ?? null,
                'label' => $entry['label'] ?? '',
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function listItem(SecurityEvent $event): array
    {
        return [
            'id' => $event->ulid,
            'type_label' => $event->type->label(),
            'person_name' => $event->user?->name,
            'severity' => $event->severity->value,
            'severity_label' => $event->severity->label(),
            'status' => $event->status->value,
            'status_label' => $event->status->label(),
            'device' => $event->display_name,
            'detected_at' => $event->detected_at?->toIso8601String(),
            'requires_attention' => $event->status->requiresAttention(),
        ];
    }

    /**
     * @return Builder<SecurityEvent>
     */
    private function baseQuery(): Builder
    {
        $estate = $this->estateContext->getEstate();

        $memberIds = DB::table('estate_users_membership')
            ->where('estate_id', $estate->id)
            ->where('status', 'accepted')
            ->pluck('user_id');

        return SecurityEvent::query()->whereIn('user_id', $memberIds);
    }

    /**
     * @param  Builder<SecurityEvent>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $attention = $filters['attention'] ?? null;

        if ($attention === 'attention') {
            $query->requiringAttention();
        } elseif ($attention === 'resolved') {
            $query->where('status', SecurityEventStatus::Resolved);
        } elseif ($attention === 'high') {
            $query->where('severity', SecurityEventSeverity::High);
        }

        if (! empty($filters['search'])) {
            $search = '%'.mb_strtolower((string) $filters['search']).'%';
            $query->whereHas('user', function (Builder $userQuery) use ($search): void {
                $userQuery->whereRaw('LOWER(name) like ?', [$search])
                    ->orWhereRaw('LOWER(email) like ?', [$search]);
            });
        }
    }
}
