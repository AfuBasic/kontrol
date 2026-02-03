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

        // Get resident count
        $totalResidents = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->count();

        $activeResidents = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->active()
            ->count();

        // Get security personnel count
        $totalSecurity = User::query()
            ->forEstate($estateId)
            ->withRole('security', $estateId)
            ->count();

        $activeSecurity = User::query()
            ->forEstate($estateId)
            ->withRole('security', $estateId)
            ->active()
            ->count();

        // Get posts stats
        $totalPosts = EstateBoardPost::forEstate($estateId)->count();
        $publishedPosts = EstateBoardPost::forEstate($estateId)->published()->count();
        $draftPosts = EstateBoardPost::forEstate($estateId)
            ->where('status', EstateBoardPostStatus::Draft)
            ->count();

        // Get comments count
        $totalComments = EstateBoardComment::where('estate_id', $estateId)->count();

        // Calculate trends (comparing to previous period)
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sixtyDaysAgo = $now->copy()->subDays(60);

        $newResidentsThisPeriod = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        $newResidentsLastPeriod = User::query()
            ->forEstate($estateId)
            ->withRole('resident', $estateId)
            ->whereBetween('created_at', [$sixtyDaysAgo, $thirtyDaysAgo])
            ->count();

        $residentsTrend = $newResidentsLastPeriod > 0
            ? round((($newResidentsThisPeriod - $newResidentsLastPeriod) / $newResidentsLastPeriod) * 100, 1)
            : ($newResidentsThisPeriod > 0 ? 100 : 0);

        $newPostsThisPeriod = EstateBoardPost::forEstate($estateId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        $newPostsLastPeriod = EstateBoardPost::forEstate($estateId)
            ->whereBetween('created_at', [$sixtyDaysAgo, $thirtyDaysAgo])
            ->count();

        $postsTrend = $newPostsLastPeriod > 0
            ? round((($newPostsThisPeriod - $newPostsLastPeriod) / $newPostsLastPeriod) * 100, 1)
            : ($newPostsThisPeriod > 0 ? 100 : 0);

        return [
            'residents' => [
                'total' => $totalResidents,
                'active' => $activeResidents,
                'trend' => $residentsTrend,
                'new_this_month' => $newResidentsThisPeriod,
            ],
            'security' => [
                'total' => $totalSecurity,
                'active' => $activeSecurity,
            ],
            'posts' => [
                'total' => $totalPosts,
                'published' => $publishedPosts,
                'draft' => $draftPosts,
                'trend' => $postsTrend,
                'new_this_month' => $newPostsThisPeriod,
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

        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->format('Y-m-d');

            $postsCount = EstateBoardPost::forEstate($estateId)
                ->whereDate('created_at', $dateStr)
                ->count();

            $commentsCount = EstateBoardComment::where('estate_id', $estateId)
                ->whereDate('created_at', $dateStr)
                ->count();

            $data[] = [
                'date' => $date->format('M j'),
                'day' => $date->format('D'),
                'posts' => $postsCount,
                'comments' => $commentsCount,
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
