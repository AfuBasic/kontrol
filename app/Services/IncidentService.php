<?php

namespace App\Services;

use App\Enums\IncidentStatus;
use App\Models\Incident;
use App\Models\IncidentComment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class IncidentService
{
    /**
     * Get the incident feed for an estate with filters.
     *
     * @param  array{category?: string, status?: string, tab?: string, search?: string}  $filters
     */
    public function getFeed(int $estateId, array $filters = []): mixed
    {
        $user = Auth::user();
        $userId = Auth::id();
        $isAdmin = $user && $user->contextHasRole('admin');

        $query = Incident::query()
            ->forEstate($estateId)
            ->with(['reporter', 'assignee'])
            ->withExists(['upvotes as is_upvoted' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }]);

        if (! $isAdmin) {
            $query->where(function ($q) use ($userId) {
                $q->where('is_private', false)
                    ->orWhere('reporter_id', $userId);
            });

            if ($user) {
                $userZoneIds = app(ZoneAudienceResolver::class)->zoneIdsForUser($user, $estateId);
                $query->where(function ($q) use ($userZoneIds, $userId) {
                    $q->whereNull('zone_id')
                        ->orWhere('reporter_id', $userId);

                    if ($userZoneIds !== []) {
                        $q->orWhereIn('zone_id', $userZoneIds);
                    }
                });
            }
        }

        // Filter by category
        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        // Filter by priority
        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        // Filter by assignee
        if (! empty($filters['assignee_id'])) {
            $query->where('assigned_to', $filters['assignee_id']);
        }

        // Filter by source
        if (! empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        // Filter by reporter
        if (! empty($filters['reporter_id'])) {
            $query->where('reporter_id', $filters['reporter_id']);
        }

        // Filter by SLA status
        if (! empty($filters['sla_status'])) {
            $now = now();
            if ($filters['sla_status'] === 'breached') {
                $query->whereNotIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
                    ->where('created_at', '<', $now->subHours(24));
            } elseif ($filters['sla_status'] === 'warning') {
                $query->whereNotIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
                    ->whereBetween('created_at', [$now->subHours(24), $now->subHours(16)]);
            } elseif ($filters['sla_status'] === 'compliant') {
                $query->where(function ($q) use ($now) {
                    $q->whereIn('status', [IncidentStatus::Solved, IncidentStatus::Closed])
                        ->orWhere('created_at', '>', $now->subHours(16));
                });
            }
        }

        // Filter by status tab (All / Open / Solved+Closed)
        if (! empty($filters['tab'])) {
            if ($filters['tab'] === 'open') {
                $query->whereIn('status', [
                    IncidentStatus::Pending,
                    IncidentStatus::Acknowledged,
                    IncidentStatus::Resolving,
                ]);
            } elseif ($filters['tab'] === 'solved') {
                $query->whereIn('status', [
                    IncidentStatus::Solved,
                    IncidentStatus::Closed,
                ]);
            }
        } elseif (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Search in title, body, reporter name, and location
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHasMorph('reporter', [User::class], function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sorting: default to newest, or can do popular (by upvotes), or by priority
        if (isset($filters['sort']) && $filters['sort'] === 'popular') {
            $query->orderByDesc('upvotes_count')->orderByDesc('created_at');
        } elseif (isset($filters['sort']) && $filters['sort'] === 'priority') {
            $query->orderByRaw("CASE 
                WHEN priority = 'critical' THEN 1 
                WHEN priority = 'high' THEN 2 
                WHEN priority = 'medium' THEN 3 
                ELSE 4 END")
                ->orderByDesc('created_at');
        } else {
            $query->orderByDesc('created_at');
        }

        // If view is board, return all records (unpaginated) to prevent card truncation
        if (isset($filters['view']) && $filters['view'] === 'board') {
            return $query->get();
        }

        return $query->paginate(15)->withQueryString();
    }

    /**
     * Get a single incident by ID.
     */
    public function getIncident(int $id, int $estateId): Incident
    {
        $userId = Auth::id();

        return Incident::query()
            ->forEstate($estateId)
            ->with(['reporter', 'assignee'])
            ->withExists(['upvotes as is_upvoted' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }])
            ->findOrFail($id);
    }

    /**
     * Get top-level comments for an incident with their replies.
     */
    public function getComments(int $incidentId): LengthAwarePaginator
    {
        return IncidentComment::query()
            ->where('incident_id', $incidentId)
            ->topLevel()
            ->with(['author', 'replies.author'])
            ->orderBy('created_at', 'asc')
            ->paginate(30);
    }
}
