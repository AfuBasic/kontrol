<?php

namespace App\Services\Resident;

use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

class AccessCodeService
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Create a new access code for a visitor.
     *
     * @param  array{visitor_name?: string, visitor_phone?: string, purpose?: string, duration_minutes: int, notes?: string}  $data
     */
    public function createCode(array $data): AccessCode
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();
        // Determine whose subscription we are checking
        $subject = $user;
        if ($user->isHouseholdMember() && $user->householdOf) {
            $subject = $user->householdOf->primaryResident;
        }

        $subscription = $subject->residentSubscription;

        // Block if subscription is expired/invalid (only if estate charges residents)
        if ($estate->settings->charge_type === 'residents' && (! $subscription || ! $subscription->isActive())) {
            $message = $user->isHouseholdMember()
                ? 'Access is currently restricted.'
                : 'Your subscription has expired or is inactive. Please visit the billing section to restore access.';

            throw ValidationException::withMessages([
                'subscription' => [$message],
            ]);
        }

        $type = $data['type'] ?? 'single_use';
        $expiresAt = null;
        $startsAt = null;
        $scheduleType = $data['schedule_type'] ?? 'one_time';
        $scheduleData = $data['schedule_data'] ?? null;
        $guestLimit = $data['guest_limit'] ?? null;
        $status = AccessCodeStatus::Active;

        if (! empty($data['starts_at'])) {
            $startsAt = Carbon::parse($data['starts_at']);
            if ($startsAt->isFuture()) {
                $status = AccessCodeStatus::Scheduled;
            }
        }

        if (! empty($data['expires_at'])) {
            $expiresAt = Carbon::parse($data['expires_at']);
        } elseif ($type === 'single_use' || $type === 'event') {
            $minutes = $data['duration_minutes'] ?? 60; // Default fallback

            // Enforce Estate Settings Constraints
            $settings = EstateSettings::forEstate($estate->id);
            $min = $settings->access_code_min_lifespan_minutes;
            $max = $settings->access_code_max_lifespan_minutes;

            if ($minutes < $min) {
                $minutes = $min;
            }
            if ($minutes > $max) {
                $minutes = $max;
            }

            $expiresAt = ($startsAt ?? now())->copy()->addMinutes($minutes);
        }

        return AccessCode::create([
            'estate_id' => $estate->id,
            'user_id' => $user->id,
            'code' => AccessCode::generateCode(),
            'type' => $type,
            'visitor_name' => $data['visitor_name'] ?? null,
            'visitor_phone' => $data['visitor_phone'] ?? null,
            'purpose' => $data['purpose'] ?? null,
            'status' => $status,
            'starts_at' => $startsAt,
            'schedule_type' => $scheduleType,
            'schedule_data' => $scheduleData,
            'guest_limit' => $guestLimit,
            'expires_at' => $expiresAt,
            'has_vehicle' => $data['has_vehicle'] ?? false,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * Get active access codes for the current user.
     *
     * @return Collection<int, AccessCode>
     */
    public function getActiveCodes(?string $search = null): Collection
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->active()
            ->search($search)
            ->orderBy('expires_at')
            ->get();
    }

    /**
     * Get access code history for the current user.
     *
     * @return Collection<int, AccessCode>
     */
    public function getCodeHistory(int $limit = 20, ?string $search = null): Collection
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        $query = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->where(function ($q) {
                $q->whereIn('status', [AccessCodeStatus::Used, AccessCodeStatus::Expired, AccessCodeStatus::Revoked])
                    ->orWhere(fn ($sq) => $sq->where('status', AccessCodeStatus::Active)
                        ->whereNotNull('expires_at')
                        ->where('expires_at', '<=', now()))
                    ->orWhere(fn ($sq) => $sq->where('type', 'long_lived')
                        ->whereNotNull('used_at'));
            })
            ->search($search)
            ->orderByDesc('created_at');

        if (! $search) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Fetch all active and scheduled passes for the Visitor Timeline (Upcoming tab).
     *
     * Returns passes ordered by effective_visit_at ascending so that the earliest
     * scheduled visit appears first. Grouping into date buckets happens on the
     * frontend via the useVisitorTimeline hook.
     *
     * This method intentionally merges what were previously two separate "active"
     * and "upcoming" buckets — the timeline uses time as its primary axis, not
     * pass state.
     *
     * @return Collection<int, AccessCode>
     */
    public function getUpcomingTimeline(?string $search = null): Collection
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->active()
            ->search($search)
            ->with('accessLogs')
            // Order by starts_at when present, then expires_at for single_use/event,
            // then created_at — mirrors the effective_visit_at precedence in the model.
            ->orderByRaw('COALESCE(starts_at, CASE WHEN type IN (\'single_use\', \'event\') THEN expires_at ELSE NULL END, created_at) ASC')
            ->get();
    }

    /**
     * Fetch completed visits for the Visitor Timeline (History tab).
     *
     * Ordered by the completion_at precedence (checked_out_at → used_at → revoked_at
     * → expires_at → created_at), most recent first.
     *
     * @return Collection<int, AccessCode>
     */
    public function getHistoryTimeline(int $limit = 50, ?string $search = null): Collection
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        $query = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->where(function ($q) {
                $q->whereIn('status', [AccessCodeStatus::Used, AccessCodeStatus::Expired, AccessCodeStatus::Revoked])
                    ->orWhere(fn ($sq) => $sq->where('status', AccessCodeStatus::Active)
                        ->whereNotNull('expires_at')
                        ->where('expires_at', '<=', now()))
                    ->orWhere(fn ($sq) => $sq->where('type', 'long_lived')
                        ->whereNotNull('used_at'));
            })
            ->search($search)
            ->with('accessLogs')
            // Order by the same precedence as getCompletionAtAttribute()
            ->orderByRaw('COALESCE(used_at, revoked_at, expires_at, created_at) DESC');

        if (! $search) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Fetch recent unique visitors for 1-tap "Invite Again" workflow.
     *
     * @return Collection<int, array{visitor_name: string, visitor_phone: string|null, purpose: string|null, type: string}>
     */
    public function getRecentUniqueVisitors(int $limit = 5): Collection
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();
        $userIds = $user->getHouseholdUserIds();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->whereNotNull('visitor_name')
            ->where('visitor_name', '!=', '')
            ->orderByDesc('created_at')
            ->get()
            ->unique('visitor_name')
            ->take($limit)
            ->values()
            ->map(fn ($code) => [
                'visitor_name' => $code->visitor_name,
                'visitor_phone' => $code->visitor_phone,
                'purpose' => $code->purpose,
                'type' => $code->type,
            ]);
    }

    /**
     * Get all access codes for the current user (paginated).
     *
     * @return Collection<int, AccessCode>
     */
    public function getAllCodes(): Collection
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get a single access code by ID for the current user.
     */
    public function getCode(int $id): ?AccessCode
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        return AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->find($id);
    }

    /**
     * Revoke an access code.
     */
    public function revokeCode(AccessCode $accessCode): void
    {
        $accessCode->revoke();
    }

    /**
     * Extend an access code validity by specified minutes.
     */
    public function extendCode(AccessCode $accessCode, int $minutes): AccessCode
    {
        $currentExpiresAt = $accessCode->expires_at ? Carbon::parse($accessCode->expires_at) : now();
        $baseTime = $currentExpiresAt->isPast() ? now() : $currentExpiresAt;
        $newExpiresAt = $baseTime->copy()->addMinutes($minutes);

        $accessCode->update([
            'expires_at' => $newExpiresAt,
            'status' => AccessCodeStatus::Active,
        ]);

        activity()
            ->performedOn($accessCode)
            ->by(Auth::user())
            ->withProperties([
                'estate_id' => $accessCode->estate_id,
                'extended_minutes' => $minutes,
                'new_expires_at' => $newExpiresAt->toIsoString(),
            ])
            ->log('Access code extended');

        return $accessCode;
    }

    /**
     * Get recent activity for the current user.
     *
     * @return Collection<int, array{type: string, message: string, time: string, time_full: string, code?: string, visitor?: string}>
     */
    public function getRecentActivity(int $limit = 10): Collection
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        // Get IDs of codes belonging to this household/estate to filter activities
        $codeIds = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->pluck('id');

        $activities = Activity::query()
            ->where(function ($query) use ($codeIds, $user) {
                // Access code activities
                $query->where(function ($q) use ($codeIds) {
                    $q->where('subject_type', AccessCode::class)
                        ->whereIn('subject_id', $codeIds);
                })
                    // User activities (like Telegram linked) where the user is both causer and subject
                    ->orWhere(function ($q) use ($user) {
                        $q->where('subject_type', User::class)
                            ->where('subject_id', $user->id)
                            ->where('causer_type', User::class)
                            ->where('causer_id', $user->id)
                            ->whereNotIn('description', ['logged in', 'logged out']);
                    });
            })
            ->with(['subject'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return $activities->map(function ($activity) {
            // Handle user activities (like Telegram linked)
            if ($activity->subject_type === User::class) {
                return $this->mapUserActivity($activity);
            }

            // Handle access code activities
            return $this->mapAccessCodeActivity($activity);
        });
    }

    /**
     * Get paginated recent activity for the current user.
     *
     * @return CursorPaginator<array{type: string, message: string, time: string, time_full: string, code?: string, visitor?: string}>
     */
    public function getRecentActivityPaginated(int $limit = 10, ?string $search = null): CursorPaginator
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $userIds = $user->getHouseholdUserIds();

        // Get IDs of codes belonging to this household/estate to filter activities
        $codeIds = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->pluck('id');

        $query = Activity::query()
            ->where(function ($query) use ($codeIds, $user) {
                // Access code activities
                $query->where(function ($q) use ($codeIds) {
                    $q->where('subject_type', AccessCode::class)
                        ->whereIn('subject_id', $codeIds);
                })
                    // User activities (like Telegram linked) where the user is both causer and subject
                    ->orWhere(function ($q) use ($user) {
                        $q->where('subject_type', User::class)
                            ->where('subject_id', $user->id)
                            ->where('causer_type', User::class)
                            ->where('causer_id', $user->id)
                            ->whereNotIn('description', ['logged in', 'logged out']);
                    });
            });

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('properties->attributes->visitor_name', 'like', "%{$search}%")
                    ->orWhere('properties->attributes->code', 'like', "%{$search}%")
                    ->orWhere('properties->attributes->purpose', 'like', "%{$search}%")
                    ->orWhere(function ($sq) use ($search) {
                        $sq->where('subject_type', AccessCode::class)
                            ->whereIn('subject_id', function ($subQuery) use ($search) {
                                $subQuery->select('id')
                                    ->from((new AccessCode)->getTable())
                                    ->where(function ($innerQuery) use ($search) {
                                        $innerQuery->where('visitor_name', 'like', "%{$search}%")
                                            ->orWhere('code', 'like', "%{$search}%")
                                            ->orWhere('purpose', 'like', "%{$search}%");
                                    });
                            });
                    });
            });
        }

        $paginator = $query->with(['subject'])
            ->orderByDesc('created_at')
            ->cursorPaginate($limit);

        $paginator->through(function ($activity) {
            // Handle user activities (like Telegram linked)
            if ($activity->subject_type === User::class) {
                return $this->mapUserActivity($activity);
            }

            // Handle access code activities
            return $this->mapAccessCodeActivity($activity);
        });

        return $paginator;
    }

    /**
     * Map a user activity to the activity format.
     *
     * @return array{type: string, message: string, time: string, time_full: string, detail?: string, ip_address?: string}
     */
    private function mapUserActivity(Activity $activity): array
    {
        $type = match ($activity->description) {
            'logged in' => 'logged_in',
            'Linked Telegram account' => 'telegram_linked',
            'Unlinked Telegram account' => 'telegram_unlinked',
            default => 'info',
        };

        $message = match ($activity->description) {
            'logged in' => 'Signed in',
            'Linked Telegram account' => 'Connected Telegram account',
            'Unlinked Telegram account' => 'Disconnected Telegram account',
            default => $activity->description,
        };

        $result = [
            'type' => $type,
            'message' => $message,
            'time' => $activity->created_at->diffForHumans(),
            'time_full' => $activity->created_at->format('M j, Y g:i A'),
            'created_at' => $activity->created_at,
        ];

        if ($type === 'logged_in') {
            $properties = $activity->properties;
            $result['detail'] = $properties['browser'] ?? null;
            $result['ip_address'] = $properties['ip_address'] ?? null;
        }

        return $result;
    }

    /**
     * Map an access code activity to the activity format.
     *
     * @return array{type: string, message: string, time: string, time_full: string, code: string, visitor: string|null, created_at: \Carbon\Carbon}
     */
    private function mapAccessCodeActivity(Activity $activity): array
    {
        /** @var AccessCode|null $code */
        $code = $activity->subject;

        // Fallback if code was deleted or not loaded
        $codeStr = $code?->code ?? $activity->properties['attributes']['code'] ?? 'Unknown';
        $visitorName = $code?->visitor_name ?? $activity->properties['attributes']['visitor_name'] ?? null;

        $type = match ($activity->description) {
            'Access code created' => 'created',
            'Access code used' => 'used',
            'Access code expired' => 'expired',
            'Access code revoked' => 'revoked',
            'Access code extended' => 'extended',
            'Visitor checked out' => 'checked_out',
            default => 'info',
        };

        $message = match ($activity->description) {
            'Access code created' => $visitorName ? "Code created for {$visitorName}" : 'Access code created',
            'Access code used' => $visitorName ? "{$visitorName} arrived" : 'Visitor arrived',
            'Access code expired' => $visitorName ? "Code for {$visitorName} expired" : 'Access code expired',
            'Access code revoked' => $visitorName ? "Code for {$visitorName} revoked" : 'Access code revoked',
            'Access code extended' => $visitorName ? "Code for {$visitorName} extended" : 'Access code extended',
            'Visitor checked out' => $visitorName ? "{$visitorName} checked out" : 'Visitor checked out',
            default => $activity->description,
        };

        return [
            'type' => $type,
            'message' => $message,
            'time' => $activity->created_at->diffForHumans(),
            'time_full' => $activity->created_at->format('M j, Y g:i A'),
            'code' => $codeStr,
            'visitor' => $visitorName,
            'created_at' => $activity->created_at,
        ];
    }

    /**
     * Get stats for the current user's home screen.
     *
     * @return array{active_codes: int, created_today: int, visitors_today: int, total_expected: int}
     */
    public function getHomeStats(): array
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();

        $today = Carbon::today();

        $userIds = $user->getHouseholdUserIds();

        // Active codes = Status is Active and not expired
        $activeCodesCount = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->active()
            ->count();

        // Codes created today
        $createdToday = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->whereDate('created_at', $today)
            ->count();

        // Visitors who actually arrived today (at least once)
        $visitorsToday = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->whereHas('accessLogs', function ($q) use ($today) {
                $q->whereDate('verified_at', $today);
            })
            ->count();

        // Expected Today = Active codes that HAVE NOT arrived today
        $expectedToday = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->active()
            ->whereDoesntHave('accessLogs', function ($q) use ($today) {
                $q->whereDate('verified_at', $today);
            })
            ->count();

        return [
            'active_codes' => $activeCodesCount,
            'created_today' => $createdToday,
            'visitors_today' => $visitorsToday,
            'expected_today' => $expectedToday,
        ];
    }

    /**
     * Get daily code generation usage and limit.
     *
     * @return array{used: int, limit: int|null}
     */
    public function getDailyUsageAndLimit(): array
    {
        $user = Auth::user();
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        $today = Carbon::today();

        $userIds = $user->getHouseholdUserIds();

        $used = AccessCode::query()
            ->forEstate($estate->id)
            ->whereIn('user_id', $userIds)
            ->whereDate('created_at', $today)
            ->count();

        return [
            'used' => $used,
            'limit' => null,
        ];
    }

    /**
     * Get available duration options based on estate settings.
     *
     * @return array<int, array{minutes: int, label: string}>
     */
    public function getDurationOptions(): array
    {
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        $min = $settings->access_code_min_lifespan_minutes ?? 30;
        $max = $settings->access_code_max_lifespan_minutes ?? 1440;

        // Base options to consider (sensible defaults)
        $standardDurations = [30, 60, 120, 240, 480, 720, 1440, 2880, 4320, 10080];

        $options = [];

        // 1. First option: Minimum
        $options[] = $min;

        // 2. Middle options: Filter standard durations that are > min and < max
        $middleOptions = array_filter($standardDurations, fn ($d) => $d > $min && $d < $max);

        // Pick a few representative ones if too many, or just use them
        // For simplicity and randomness as requested, let's pick up to 3 random ones if there are many,
        // but sorting them makes more UX sense than random.
        // User asked for "randomly choose other options", lets pick 3 random ones from the valid range if available.
        if (count($middleOptions) > 3) {
            $middleKeys = array_rand($middleOptions, 3);
            $middleOptions = array_intersect_key($middleOptions, array_flip((array) $middleKeys));
        }

        $options = array_merge($options, $middleOptions);

        // 3. Last option: Maximum (if different from min)
        if ($max > $min && ! in_array($max, $options)) {
            $options[] = $max;
        }

        // Sort unique values
        $options = array_values(array_unique($options));
        sort($options);

        // Format for frontend
        return array_map(fn ($minutes) => [
            'minutes' => $minutes,
            'label' => $this->formatDuration($minutes),
        ], $options);
    }

    private function formatDuration(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes} minutes";
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        if ($hours < 24) {
            return $remainingMinutes > 0
                ? "{$hours} hr {$remainingMinutes} min"
                : "{$hours} ".($hours == 1 ? 'hour' : 'hours');
        }

        $days = floor($hours / 24);

        return "{$days} ".($days == 1 ? 'day' : 'days');
    }

    /**
     * Get duration constraints for custom input.
     */
    public function getDurationConstraints(): array
    {
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        return [
            'min' => $settings->access_code_min_lifespan_minutes,
            'max' => $settings->access_code_max_lifespan_minutes,
        ];
    }

    /**
     * Get usage history for an access code with cursor pagination.
     *
     * @return CursorPaginator<AccessLog>
     */
    public function getUsageHistory(AccessCode $accessCode, ?string $dateFilter = null, int $perPage = 15): CursorPaginator
    {
        $query = $accessCode->accessLogs()
            ->with('verifier:id,name')
            ->orderByDesc('verified_at');

        if ($dateFilter) {
            $date = Carbon::parse($dateFilter);
            $query->whereDate('verified_at', $date);
        }

        return $query->cursorPaginate($perPage);
    }

    /**
     * Increment share count and update last shared timestamp.
     */
    public function incrementShare(AccessCode $accessCode): void
    {
        $accessCode->increment('share_count');
        $accessCode->update(['last_shared_at' => now()]);
    }
}
