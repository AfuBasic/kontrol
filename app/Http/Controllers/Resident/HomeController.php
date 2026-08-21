<?php

namespace App\Http\Controllers\Resident;

use App\Enums\EstateBoardPostAudience;
use App\Enums\IncidentStatus;
use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Models\Incident;
use App\Services\Admin\EstateBoardService;
use App\Services\EstateContextService;
use App\Services\Resident\AccessCodeService;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        protected AccessCodeService $accessCodeService,
        protected EstateContextService $estateContext,
    ) {}

    public function __invoke(): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();
        $isHouseholdMember = $user->isHouseholdMember();

        $activeCodesCollection = $this->accessCodeService->getActiveCodes();
        $tz = config('app.timezone', 'Africa/Lagos');
        $todayDate = now($tz)->toDateString();

        $activePassesCount = $activeCodesCollection->filter(function ($code) use ($tz, $todayDate) {
            $isFuture = $code->starts_at ? $code->starts_at->isFuture() : false;
            $isExpired = $code->expires_at ? $code->expires_at->isPast() : false;

            if ($isFuture || $isExpired || $code->status->value === 'revoked' || $code->status->value === 'used') {
                return false;
            }

            // For long_lived passes: if already used today, it is not currently pending arrival today
            if ($code->type === 'long_lived') {
                $usedToday = $code->relationLoaded('accessLogs')
                    ? $code->accessLogs->contains(fn ($log) => $log->verified_at && CarbonImmutable::instance($log->verified_at)->setTimezone($tz)->toDateString() === $todayDate)
                    : $code->accessLogs()->whereDate('verified_at', $todayDate)->exists();

                return ! $usedToday;
            }

            return true;
        })->count();

        $upcomingTodayCount = $activeCodesCollection->filter(function ($code) {
            $isFuture = $code->starts_at ? $code->starts_at->isFuture() : false;
            $isToday = $code->starts_at ? $code->starts_at->isToday() : false;
            $isExpired = $code->expires_at ? $code->expires_at->isPast() : false;

            return $isFuture && $isToday && ! $isExpired && $code->status->value !== 'revoked' && $code->status->value !== 'used';
        })->count();

        $upcomingFutureCount = $activeCodesCollection->filter(function ($code) use ($tz, $todayDate) {
            $isFuture = $code->starts_at ? $code->starts_at->isFuture() : false;
            $isToday = $code->starts_at ? $code->starts_at->isToday() : false;
            $isExpired = $code->expires_at ? $code->expires_at->isPast() : false;

            if ($isExpired || $code->status->value === 'revoked' || $code->status->value === 'used') {
                return false;
            }

            // If long_lived pass used today, it lines up as upcoming for tomorrow
            if ($code->type === 'long_lived' && ! $isFuture) {
                $usedToday = $code->relationLoaded('accessLogs')
                    ? $code->accessLogs->contains(fn ($log) => $log->verified_at && CarbonImmutable::instance($log->verified_at)->setTimezone($tz)->toDateString() === $todayDate)
                    : $code->accessLogs()->whereDate('verified_at', $todayDate)->exists();

                return $usedToday;
            }

            return $isFuture && ! $isToday;
        })->count();

        $openIncidentsCount = Incident::query()
            ->where('estate_id', $estate->id)
            ->where(function ($q) use ($user) {
                $q->where('reporter_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            })
            ->whereIn('status', [
                IncidentStatus::Pending,
                IncidentStatus::Acknowledged,
                IncidentStatus::Resolving,
            ])
            ->count();

        return Inertia::render('Resident/Home', [
            // Eager - lightweight command center shell
            'stats' => $this->accessCodeService->getHomeStats(),
            'estateName' => $estate->name,
            'openIncidentsCount' => $openIncidentsCount,
            'activePassesCount' => $activePassesCount,
            'upcomingPassesCount' => $upcomingTodayCount,
            'upcomingTodayCount' => $upcomingTodayCount,
            'upcomingFutureCount' => $upcomingFutureCount,
            'totalScheduledCount' => $activePassesCount + $upcomingTodayCount + $upcomingFutureCount,

            // Deferred - heavier secondary sections
            'activeCodes' => Inertia::defer(fn () => $activeCodesCollection->map(fn ($code) => [
                'id' => $code->id,
                'code' => $code->code,
                'type' => $code->type,
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'status' => $code->status->value,
                'source' => $code->source->value,
                'expires_at' => $code->expires_at?->toISOString(),
                'used_at' => $code->used_at?->toISOString(),
                'time_remaining' => $code->time_remaining,
                'created_at' => $code->created_at?->toISOString(),
            ])),
            'recentActivity' => Inertia::defer(fn () => $this->accessCodeService->getRecentActivity(5)),
            'latestAnnouncements' => Inertia::defer(function () use ($estate) {
                $boardService = app(EstateBoardService::class);
                $announcements = $boardService->getFeed($estate->id, 3, [
                    EstateBoardPostAudience::All,
                    EstateBoardPostAudience::Residents,
                ]);

                return $announcements->items();
            }),
            'unpaidDues' => Inertia::defer(function () use ($user, $estate, $isHouseholdMember) {
                if ($isHouseholdMember) {
                    return [];
                }

                return CollectionAssignment::where('user_id', $user->id)
                    ->where('estate_id', $estate->id)
                    ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
                    ->with('collection')
                    ->latest()
                    ->get()
                    ->map(fn ($assignment) => [
                        'ulid' => $assignment->ulid,
                        'amount_due' => $assignment->amount_due,
                        'amount_paid' => $assignment->amount_paid,
                        'status' => $assignment->status,
                        'due_date' => $assignment->due_date?->toISOString() ?: $assignment->due_date,
                        'collection' => [
                            'name' => $assignment->collection->name,
                            'description' => $assignment->collection->description,
                        ],
                    ]);
            }),
            'unpaidDuesCount' => Inertia::defer(function () use ($user, $estate, $isHouseholdMember) {
                if ($isHouseholdMember) {
                    return 0;
                }

                return CollectionAssignment::where('user_id', $user->id)
                    ->where('estate_id', $estate->id)
                    ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
                    ->count();
            }),
            'totalUnpaidDuesAmount' => Inertia::defer(function () use ($user, $estate, $isHouseholdMember) {
                if ($isHouseholdMember) {
                    return 0;
                }

                $rows = CollectionAssignment::where('user_id', $user->id)
                    ->where('estate_id', $estate->id)
                    ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
                    ->get(['amount_due', 'amount_paid']);

                return $rows->sum('amount_due') - $rows->sum('amount_paid');
            }),
        ]);
    }
}
