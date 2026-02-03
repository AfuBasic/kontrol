<?php

namespace App\Services\Admin;

use App\Enums\EstateBoardPostStatus;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity;

class DashboardService
{
    /**
     * Get the current user's active estate.
     */
    public function getCurrentEstate(): Estate
    {
        $user = Auth::user();

        return $user->estates()
            ->wherePivot('status', 'accepted')
            ->firstOrFail();
    }

    /**
     * Get overview statistics for the dashboard.
     *
     * @return array<string, mixed>
     */
    public function getOverviewStats(): array
    {
        $estate = $this->getCurrentEstate();
        $estateId = $estate->id;

        // Optimized resident stats
        $residentStats = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when suspended_at is null then 1 else 0 end) as active')
            ->toBase()
            ->first();

        // Optimized security personnel stats
        $securityStats = User::query()
            ->forEstate($estateId)
            ->withRole('security', $estateId)
            ->selectRaw('count(*) as total')
            ->selectRaw('sum(case when suspended_at is null then 1 else 0 end) as active')
            ->toBase()
            ->first();

        // Optimized posts stats
        $postStats = EstateBoardPost::forEstate($estateId)
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when status = ? and published_at is not null then 1 else 0 end) as published", [EstateBoardPostStatus::Published->value])
            ->selectRaw("sum(case when status = ? then 1 else 0 end) as draft", [EstateBoardPostStatus::Draft->value])
            ->toBase()
            ->first();

        // Get comments count
        $totalComments = EstateBoardComment::where('estate_id', $estateId)->count();

        // Calculate trends (comparing to previous period)
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sixtyDaysAgo = $now->copy()->subDays(60);

        // Optimized resident trends
        $residentTrends = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->selectRaw("sum(case when created_at >= ? then 1 else 0 end) as new_this_period", [$thirtyDaysAgo])
            ->selectRaw("sum(case when created_at >= ? and created_at < ? then 1 else 0 end) as new_last_period", [$sixtyDaysAgo, $thirtyDaysAgo])
            ->toBase()
            ->first();

        $residentsTrend = $residentTrends->new_last_period > 0
            ? round((($residentTrends->new_this_period - $residentTrends->new_last_period) / $residentTrends->new_last_period) * 100, 1)
            : ($residentTrends->new_this_period > 0 ? 100 : 0);

        // Optimized posts trends
        $postsTrends = EstateBoardPost::forEstate($estateId)
            ->selectRaw("sum(case when created_at >= ? then 1 else 0 end) as new_this_period", [$thirtyDaysAgo])
            ->selectRaw("sum(case when created_at >= ? and created_at < ? then 1 else 0 end) as new_last_period", [$sixtyDaysAgo, $thirtyDaysAgo])
            ->toBase()
            ->first();

        $postsTrend = $postsTrends->new_last_period > 0
            ? round((($postsTrends->new_this_period - $postsTrends->new_last_period) / $postsTrends->new_last_period) * 100, 1)
            : ($postsTrends->new_this_period > 0 ? 100 : 0);

        return [
            'residents' => [
                'total' => $residentStats->total,
                'active' => $residentStats->active,
                'trend' => $residentsTrend,
                'new_this_month' => $residentTrends->new_this_period,
            ],
            'security' => [
                'total' => $securityStats->total,
                'active' => $securityStats->active,
            ],
            'posts' => [
                'total' => $postStats->total,
                'published' => $postStats->published,
                'draft' => $postStats->draft,
                'trend' => $postsTrend,
                'new_this_month' => $postsTrends->new_this_period,
            ],
            'comments' => [
                'total' => $totalComments,
            ],
            'estate' => [
                'name' => $estate->name,
                'address' => $estate->address,
            ],
        ];
    }

    /**
     * Get activity chart data for the last 7 days.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getActivityChartData(): array
    {
        $estate = $this->getCurrentEstate();
        $estateId = $estate->id;

        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        // Get posts grouped by date
        $postsData = EstateBoardPost::forEstate($estateId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        // Get comments grouped by date
        $commentsData = EstateBoardComment::where('estate_id', $estateId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->format('Y-m-d');

            $data[] = [
                'date' => $date->format('M j'),
                'day' => $date->format('D'),
                'posts' => $postsData->get($dateStr, 0),
                'comments' => $commentsData->get($dateStr, 0),
            ];
        }

        return $data;
    }

    /**
     * Get recent activity logs.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getRecentActivity(int $limit = 10): Collection
    {
        $estate = $this->getCurrentEstate();

        return Activity::query()
            ->where('properties->estate_id', $estate->id)
            ->orWhere(function ($query) use ($estate) {
                $query->whereHasMorph('subject', [EstateBoardPost::class], function ($q) use ($estate) {
                    $q->where('estate_id', $estate->id);
                });
            })
            ->with('causer:id,name,email')
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'description' => $activity->description,
                'causer' => $activity->causer ? [
                    'name' => $activity->causer->name,
                    'email' => $activity->causer->email,
                ] : null,
                'subject_type' => class_basename($activity->subject_type ?? ''),
                'created_at' => $activity->created_at->diffForHumans(),
                'created_at_full' => $activity->created_at->format('M j, Y g:i A'),
            ]);
    }

    /**
     * Get recent estate board posts.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getRecentPosts(int $limit = 5): Collection
    {
        $estate = $this->getCurrentEstate();

        return EstateBoardPost::forEstate($estate->id)
            ->published()
            ->with(['author:id,name', 'media'])
            ->withCount('comments')
            ->latest('published_at')
            ->take($limit)
            ->get()
            ->map(fn (EstateBoardPost $post) => [
                'id' => $post->id,
                'hashid' => $post->hashid,
                'title' => $post->title,
                'body' => $post->body,
                'author' => [
                    'name' => $post->author->name,
                ],
                'comments_count' => $post->comments_count,
                'media_count' => $post->media->count(),
                'has_media' => $post->media->isNotEmpty(),
                'published_at' => $post->published_at->diffForHumans(),
                'audience' => $post->audience->value,
            ]);
    }

    /**
     * Get quick stats for today.
     *
     * @return array<string, int>
     */
    public function getTodayStats(): array
    {
        $estate = $this->getCurrentEstate();
        $estateId = $estate->id;
        $today = Carbon::today();

        return [
            'new_posts' => EstateBoardPost::forEstate($estateId)
                ->whereDate('created_at', $today)
                ->count(),
            'new_comments' => EstateBoardComment::where('estate_id', $estateId)
                ->whereDate('created_at', $today)
                ->count(),
            'new_residents' => User::query()
                ->forEstate($estateId)
                ->withRole('resident', $estateId)
                ->whereDate('created_at', $today)
                ->count(),
        ];
    }
}
