<?php

namespace App\Services\Admin;

use App\Enums\EstateBoardPostAudience;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\Zone;
use App\Services\ZoneAudienceResolver;
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
    public function getFeed(int $estateId, int $perPage = 10, ?array $audiences = null, ?string $filter = null, ?string $search = null, ?string $category = null, ?string $priority = null): CursorPaginator
    {
        $user = auth()->user();
        $isAdmin = $user && $user->contextHasRole('admin');
        $isPropertyOwner = $user && $user->contextHasRole('property_owner');
        $propertyOwnerId = $user ? $user->getPropertyOwnerForEstate($estateId)?->id : null;
        $propertyId = $user?->profile?->property_id;
        $userZoneIds = $user ? app(ZoneAudienceResolver::class)->zoneIdsForUser($user, $estateId) : [];

        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->published()
            ->when($audiences !== null, fn ($q) => $q->forAudience($audiences))
            ->when($filter === 'estate', fn ($q) => $q->whereNull('property_owner_id'))
            ->when($filter === 'property_owner', fn ($q) => $q->whereNotNull('property_owner_id'))
            ->when(! $isAdmin, function ($query) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner, $userZoneIds) {
                $query->where(function ($q) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner, $userZoneIds) {
                    $q->where(function ($estatePosts) use ($user, $propertyId, $userZoneIds) {
                        $estatePosts->whereNull('property_owner_id')
                            ->where(function ($scope) use ($user, $propertyId, $userZoneIds) {
                                $scope->where(function ($all) {
                                    $all->where(function ($inner) {
                                        $inner->whereNull('applies_to')->orWhere('applies_to', 'all');
                                    })->whereDoesntHave('targets');
                                })->orWhere(function ($targeted) use ($user, $propertyId, $userZoneIds) {
                                    $targeted->whereIn('applies_to', ['custom', 'target', 'zone'])
                                        ->whereHas('targets', function ($t) use ($user, $propertyId, $userZoneIds) {
                                            $t->where(fn ($sub) => $sub->where('target_type', 'user')->where('target_id', $user->id))
                                                ->when($propertyId, fn ($sub) => $sub->orWhere(fn ($sub2) => $sub2->where('target_type', 'property')->where('target_id', $propertyId)))
                                                ->when($userZoneIds !== [], fn ($sub) => $sub->orWhere(fn ($sub2) => $sub2->whereIn('target_type', ['zone', Zone::class])->whereIn('target_id', $userZoneIds)));
                                        });
                                });
                            });
                    });

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
                    $term = '%'.$search.'%';
                    $sub->where('title', 'like', $term)
                        ->orWhere('body', 'like', $term);
                });
            })
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($priority, fn ($q) => $q->where('priority', $priority))
            ->with([
                'author:id,name,email',
                'media' => fn ($q) => $q->limit(4)->orderBy('sort_order'),
            ])
            ->withCount('comments')
            ->orderByDesc('published_at')
            ->cursorPaginate($perPage);
    }

    public function getFeedMetrics(int $estateId, ?string $filter = null): array
    {
        $baseQuery = EstateBoardPost::query()
            ->forEstate($estateId)
            ->when($filter === 'estate', fn ($q) => $q->whereNull('property_owner_id'))
            ->when($filter === 'property_owner', fn ($q) => $q->whereNotNull('property_owner_id'));

        $total = (clone $baseQuery)->count();

        $thisMonth = (clone $baseQuery)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $lastBroadcast = (clone $baseQuery)->latest()->first();

        return [
            'total' => $total,
            'this_month' => $thisMonth,
            'last_broadcast' => $lastBroadcast ? $lastBroadcast->created_at->diffForHumans() : null,
        ];
    }

    /**
     * Get a single post with its details.
     *
     * @param  array<EstateBoardPostAudience>|null  $audiences  Filter by audience (null = all audiences for admins)
     */
    public function getPost(int $postId, int $estateId, ?array $audiences = null): ?EstateBoardPost
    {
        $user = auth()->user();
        $isAdmin = $user && $user->contextHasRole('admin');
        $isPropertyOwner = $user && $user->contextHasRole('property_owner');
        $propertyOwnerId = $user ? $user->getPropertyOwnerForEstate($estateId)?->id : null;
        $propertyId = $user?->profile?->property_id;
        $userZoneIds = $user ? app(ZoneAudienceResolver::class)->zoneIdsForUser($user, $estateId) : [];

        return EstateBoardPost::query()
            ->forEstate($estateId)
            ->when($audiences !== null, fn ($q) => $q->forAudience($audiences))
            ->when(! $isAdmin, function ($query) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner, $userZoneIds) {
                $query->where(function ($q) use ($user, $propertyOwnerId, $propertyId, $isPropertyOwner, $userZoneIds) {
                    $q->where(function ($estatePosts) use ($user, $propertyId, $userZoneIds) {
                        $estatePosts->whereNull('property_owner_id')
                            ->where(function ($scope) use ($user, $propertyId, $userZoneIds) {
                                $scope->where(function ($all) {
                                    $all->where(function ($inner) {
                                        $inner->whereNull('applies_to')->orWhere('applies_to', 'all');
                                    })->whereDoesntHave('targets');
                                })->orWhere(function ($targeted) use ($user, $propertyId, $userZoneIds) {
                                    $targeted->whereIn('applies_to', ['custom', 'target', 'zone'])
                                        ->whereHas('targets', function ($t) use ($user, $propertyId, $userZoneIds) {
                                            $t->where(fn ($sub) => $sub->where('target_type', 'user')->where('target_id', $user->id))
                                                ->when($propertyId, fn ($sub) => $sub->orWhere(fn ($sub2) => $sub2->where('target_type', 'property')->where('target_id', $propertyId)))
                                                ->when($userZoneIds !== [], fn ($sub) => $sub->orWhere(fn ($sub2) => $sub2->whereIn('target_type', ['zone', Zone::class])->whereIn('target_id', $userZoneIds)));
                                        });
                                });
                            });
                    });

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
                'reads',
                'targets',
            ])
            ->withCount(['comments', 'reads'])
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
            ->withCount(['comments', 'media', 'reads'])
            ->orderByDesc('created_at')
            ->cursorPaginate($perPage);
    }
}
