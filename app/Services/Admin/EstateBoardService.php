<?php

namespace App\Services\Admin;

use App\Enums\EstateBoardPostAudience;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Support\Facades\DB;

class EstateBoardService
{
    /**
     * Get the feed of published posts for an estate using cursor pagination.
     *
     * @param  array<EstateBoardPostAudience>|null  $audiences  Filter by audience (null = all audiences for admins)
     * @param  string|null  $filter  Filter by source ('estate' | 'property_owner' | null)
     * @param  string|null  $search  Filter by search text
     * @return CursorPaginator<EstateBoardPost>
     */
    public function getFeed(int $estateId, int $perPage = 10, ?array $audiences = null, ?string $filter = null, ?string $search = null): CursorPaginator
    {
        $user = auth()->user();
        if ($user) {
            setPermissionsTeamId($estateId);
        }
        $isAdmin = $user && $user->hasRole('admin');
        $isPropertyOwner = $user && $user->hasRole('property_owner');
        $propertyOwnerId = $user?->profile?->property_owner_id;
        $propertyId = $user?->profile?->property_id;

        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->published()
            ->when($audiences !== null, fn ($q) => $q->forAudience($audiences))
            ->when($filter === 'estate', fn ($q) => $q->whereNull('property_owner_id'))
            ->when($filter === 'property_owner', fn ($q) => $q->whereNotNull('property_owner_id'))
            ->when(! $isAdmin, function ($query) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner) {
                $query->where(function ($q) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner) {
                    $q->whereNull('property_owner_id');

                    if ($propertyOwnerId) {
                        $q->orWhere(function ($sq) use ($user, $propertyOwnerId, $propertyId) {
                            $sq->where('property_owner_id', $propertyOwnerId)
                                ->where(function ($sq2) use ($user, $propertyId) {
                                    $sq2->where('applies_to', 'all')
                                        ->orWhere(function ($sq3) use ($user, $propertyId) {
                                            $sq3->where('applies_to', 'custom')
                                                ->whereExists(function ($tq) use ($user, $propertyId) {
                                                    $tq->select(DB::raw(1))
                                                        ->from('estate_board_post_targets')
                                                        ->whereColumn('estate_board_post_targets.estate_board_post_id', 'estate_board_posts.id')
                                                        ->where(function ($tq2) use ($user, $propertyId) {
                                                            $tq2->where(fn ($sub) => $sub->where('target_type', 'user')->where('target_id', $user->id))
                                                                ->when($propertyId, fn ($sub) => $sub->orWhere(fn ($sub2) => $sub2->where('target_type', 'property')->where('target_id', $propertyId)));
                                                        });
                                                });
                                        });
                                });
                        });
                    }

                    if ($isPropertyOwner) {
                        $q->orWhere('property_owner_id', $user->id);
                    }
                });
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $term = '%' . $search . '%';
                    $sub->where('title', 'like', $term)
                        ->orWhere('body', 'like', $term);
                });
            })
            ->with([
                'author:id,name,email',
                'media' => fn ($q) => $q->limit(4)->orderBy('sort_order'),
            ])
            ->withCount('comments')
            ->orderByDesc('published_at')
            ->cursorPaginate($perPage);
    }

    /**
     * Get a single post with its details.
     *
     * @param  array<EstateBoardPostAudience>|null  $audiences  Filter by audience (null = all audiences for admins)
     */
    public function getPost(int $postId, int $estateId, ?array $audiences = null): ?EstateBoardPost
    {
        $user = auth()->user();
        if ($user) {
            setPermissionsTeamId($estateId);
        }
        $isAdmin = $user && $user->hasRole('admin');
        $isPropertyOwner = $user && $user->hasRole('property_owner');
        $propertyOwnerId = $user?->profile?->property_owner_id;
        $propertyId = $user?->profile?->property_id;

        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->when($audiences !== null, fn ($q) => $q->forAudience($audiences))
            ->when(! $isAdmin, function ($query) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner) {
                $query->where(function ($q) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner) {
                    $q->whereNull('property_owner_id');

                    if ($propertyOwnerId) {
                        $q->orWhere(function ($sq) use ($user, $propertyOwnerId, $propertyId) {
                            $sq->where('property_owner_id', $propertyOwnerId)
                                ->where(function ($sq2) use ($user, $propertyId) {
                                    $sq2->where('applies_to', 'all')
                                        ->orWhere(function ($sq3) use ($user, $propertyId) {
                                            $sq3->where('applies_to', 'custom')
                                                ->whereExists(function ($tq) use ($user, $propertyId) {
                                                    $tq->select(DB::raw(1))
                                                        ->from('estate_board_post_targets')
                                                        ->whereColumn('estate_board_post_targets.estate_board_post_id', 'estate_board_posts.id')
                                                        ->where(function ($tq2) use ($user, $propertyId) {
                                                            $tq2->where(fn ($sub) => $sub->where('target_type', 'user')->where('target_id', $user->id))
                                                                ->when($propertyId, fn ($sub) => $sub->orWhere(fn ($sub2) => $sub2->where('target_type', 'property')->where('target_id', $propertyId)));
                                                        });
                                                });
                                        });
                                });
                        });
                    }

                    if ($isPropertyOwner) {
                        $q->orWhere('property_owner_id', $user->id);
                    }
                });
            })
            ->with([
                'author:id,name,email',
                'media',
            ])
            ->withCount('comments')
            ->find($postId);
    }

    /**
     * Get comments for a post using cursor pagination.
     *
     * @return CursorPaginator<EstateBoardComment>
     */
    public function getComments(int $postId, int $estateId, int $perPage = 15): CursorPaginator
    {
        return EstateBoardComment::query()
            ->where('estate_board_post_id', $postId)
            ->where('estate_id', $estateId)
            ->topLevel()
            ->with([
                'author:id,name,email',
                'replies' => fn ($q) => $q->with('author:id,name,email')->latest()->limit(3),
            ])
            ->withCount('replies')
            ->oldest()
            ->cursorPaginate($perPage);
    }

    /**
     * Get admin posts (including drafts) for management.
     *
     * @return CursorPaginator<EstateBoardPost>
     */
    public function getAdminPosts(int $estateId, int $perPage = 15): CursorPaginator
    {
        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->with(['author:id,name,email'])
            ->withCount(['comments', 'media'])
            ->orderByDesc('created_at')
            ->cursorPaginate($perPage);
    }
}
