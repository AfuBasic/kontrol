<?php

namespace App\Services;

use App\Enums\IncidentStatus;
use App\Models\Incident;
use App\Models\IncidentComment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class IncidentService
{
    /**
     * Get the incident feed for an estate with filters.
     *
     * @param  array{category?: string, status?: string, tab?: string, search?: string}  $filters
     */
    public function getFeed(int $estateId, array $filters = []): LengthAwarePaginator
    {
        $userId = Auth::id();

        $query = Incident::query()
            ->forEstate($estateId)
            ->with(['reporter', 'assignee'])
            ->withExists(['upvotes as is_upvoted' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }]);

        // Filter by category
        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
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

        // Search in title and body
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            });
        }

        // Sorting: default to newest, or can do popular (by upvotes)
        if (isset($filters['sort']) && $filters['sort'] === 'popular') {
            $query->orderByDesc('upvotes_count')->orderByDesc('created_at');
        } else {
            $query->orderByDesc('created_at');
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
