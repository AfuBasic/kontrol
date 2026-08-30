<?php

namespace App\Models;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * @property int $id
 * @property int $estate_id
 * @property int $user_id
 * @property string $code
 * @property string $type
 * @property AccessCodeSource $source
 * @property string|null $visitor_name
 * @property string|null $visitor_phone
 * @property string|null $purpose
 * @property AccessCodeStatus $status
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $used_at
 * @property CarbonImmutable|null $revoked_at
 * @property int|null $verified_by
 * @property string|null $notes
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Collection<int, AccessLog> $accessLogs
 * @property-read int|null $access_logs_count
 * @property-read Collection<int, Activity> $activities
 * @property-read int|null $activities_count
 * @property-read Estate $estate
 * @property-read string $time_remaining
 * @property-read CarbonImmutable $effective_visit_at
 * @property-read CarbonImmutable|null $completion_at
 * @property-read User $user
 * @property-read User|null $verifiedBy
 * @property-read VisitorPassReminder|null $reminder
 *
 * @method static Builder<static>|AccessCode active()
 * @method static Builder<static>|AccessCode expiredButNotMarked()
 * @method static Builder<static>|AccessCode forEstate(int $estateId)
 * @method static Builder<static>|AccessCode forUser(int $userId)
 * @method static Builder<static>|AccessCode newModelQuery()
 * @method static Builder<static>|AccessCode newQuery()
 * @method static Builder<static>|AccessCode query()
 * @method static Builder<static>|AccessCode search(?string $term = null)
 * @method static Builder<static>|AccessCode whereCode($value)
 * @method static Builder<static>|AccessCode whereCreatedAt($value)
 * @method static Builder<static>|AccessCode whereEstateId($value)
 * @method static Builder<static>|AccessCode whereExpiresAt($value)
 * @method static Builder<static>|AccessCode whereId($value)
 * @method static Builder<static>|AccessCode whereNotes($value)
 * @method static Builder<static>|AccessCode wherePurpose($value)
 * @method static Builder<static>|AccessCode whereRevokedAt($value)
 * @method static Builder<static>|AccessCode whereSource($value)
 * @method static Builder<static>|AccessCode whereStatus($value)
 * @method static Builder<static>|AccessCode whereType($value)
 * @method static Builder<static>|AccessCode whereUpdatedAt($value)
 * @method static Builder<static>|AccessCode whereUsedAt($value)
 * @method static Builder<static>|AccessCode whereUserId($value)
 * @method static Builder<static>|AccessCode whereVerifiedBy($value)
 * @method static Builder<static>|AccessCode whereVisitorName($value)
 * @method static Builder<static>|AccessCode whereVisitorPhone($value)
 *
 * @mixin \Eloquent
 */
class AccessCode extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'estate_id',
        'user_id',
        'code',
        'pass_uuid',
        'qr_token',
        'qr_image_path',
        'type', // single_use, long_lived
        'source', // web, telegram
        'visitor_name',
        'visitor_phone',
        'purpose',
        'status',
        'expires_at',
        'used_at',
        'scanned_at',
        'revoked_at',
        'verified_by',
        'has_vehicle',
        'notes',
        'share_count',
        'last_shared_at',
        'starts_at',
        'schedule_type',
        'schedule_data',
        'guest_limit',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => AccessCodeStatus::class,
            'source' => AccessCodeSource::class,
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'scanned_at' => 'datetime',
            'revoked_at' => 'datetime',
            'has_vehicle' => 'boolean',
            'last_shared_at' => 'datetime',
            'starts_at' => 'datetime',
            'schedule_data' => 'array',
            'guest_limit' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (AccessCode $accessCode) {
            $accessCode->pass_uuid = (string) Str::uuid();
            $accessCode->qr_token = Str::random(40);
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'used_at', 'revoked_at', 'verified_by'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(function (string $eventName) {
                if ($eventName === 'updated') {
                    if ($this->wasChanged('status')) {
                        return match ($this->status) {
                            AccessCodeStatus::Used => 'Access code used',
                            AccessCodeStatus::Revoked => 'Access code revoked',
                            AccessCodeStatus::Expired => 'Access code expired',
                            default => 'Access code updated',
                        };
                    }

                    if ($this->wasChanged('verified_by')) {
                        return 'Access code used';
                    }
                }

                return match ($eventName) {
                    'created' => 'Access code created',
                    'updated' => 'Access code updated',
                    'deleted' => 'Access code deleted',
                    default => "Access code {$eventName}",
                };
            });
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * @return HasMany<AccessLog, $this>
     */
    public function accessLogs(): HasMany
    {
        return $this->hasMany(AccessLog::class);
    }

    /**
     * @param  Builder<AccessCode>  $query
     * @return Builder<AccessCode>
     */
    public function scopeForEstate(Builder $query, int $estateId): Builder
    {
        return $query->where('estate_id', $estateId);
    }

    /**
     * @param  Builder<AccessCode>  $query
     * @return Builder<AccessCode>
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * @param  Builder<AccessCode>  $query
     * @return Builder<AccessCode>
     */
    public function scopeSearch(Builder $query, ?string $term = null): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('code', 'like', "%{$term}%")
                ->orWhere('visitor_name', 'like', "%{$term}%")
                ->orWhere('visitor_phone', 'like', "%{$term}%")
                ->orWhere('purpose', 'like', "%{$term}%");
        });
    }

    /**
     * @param  Builder<AccessCode>  $query
     * @return Builder<AccessCode>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [AccessCodeStatus::Active, AccessCodeStatus::Scheduled])
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    /**
     * @param  Builder<AccessCode>  $query
     * @return Builder<AccessCode>
     */
    public function scopeExpiredButNotMarked(Builder $query): Builder
    {
        return $query->where('status', AccessCodeStatus::Active)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now());
    }

    public function isActive(): bool
    {
        if (! in_array($this->status, [AccessCodeStatus::Active, AccessCodeStatus::Scheduled])) {
            return false;
        }

        // If expired_at is null, means it never expires
        if ($this->expires_at === null) {
            return true;
        }

        return $this->expires_at->isFuture();
    }

    public function isScheduledForFuture(): bool
    {
        return $this->starts_at !== null && $this->starts_at->isFuture();
    }

    public function matchesRecurringSchedule(?CarbonInterface $time = null): bool
    {
        $time ??= now();

        if ($this->schedule_type !== 'recurring' || ! is_array($this->schedule_data)) {
            return true;
        }

        $data = $this->schedule_data;

        if (isset($data['days']) && is_array($data['days'])) {
            // Carbon dayOfWeek returns 0 (Sun) - 6 (Sat)
            if (! in_array($time->dayOfWeek, $data['days'])) {
                return false;
            }
        }

        if (isset($data['start_time']) && isset($data['end_time'])) {
            $currentTime = $time->format('H:i');
            if ($currentTime < $data['start_time'] || $currentTime > $data['end_time']) {
                return false;
            }
        }

        return true;
    }

    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    /**
     * @return HasOne<VisitorPassReminder, $this>
     */
    public function reminder(): HasOne
    {
        return $this->hasOne(VisitorPassReminder::class);
    }

    public function markAsUsed(?User $verifiedBy = null): void
    {
        $this->update([
            'status' => AccessCodeStatus::Used,
            'used_at' => now(),
            'verified_by' => $verifiedBy?->id,
        ]);

        $this->reminder?->cancel();
    }

    public function revoke(): void
    {
        $this->update([
            'status' => AccessCodeStatus::Revoked,
            'revoked_at' => now(),
        ]);

        $this->reminder?->cancel();
    }

    public function isEligibleForVisitReminder(): bool
    {
        if (! $this->starts_at) {
            return false;
        }

        if (! in_array($this->status, [AccessCodeStatus::Active, AccessCodeStatus::Scheduled], true)) {
            return false;
        }

        return $this->starts_at->greaterThan(now()->addHours(24));
    }

    public function getTimeRemainingAttribute(): string
    {
        if (! $this->isActive()) {
            return 'Expired';
        }

        if ($this->expires_at === null) {
            return 'Never expires';
        }

        return $this->expires_at->diffForHumans(['parts' => 2, 'short' => true]);
    }

    /**
     * The canonical "when is this visit scheduled?" field for the Visitor Timeline.
     *
     * Precedence:
     *   1. starts_at  - explicit visitor arrival time
     *   2. expires_at - only for non-schedulable pass types (single_use, event)
     *   3. created_at - last resort; prevents orphaned records on the timeline
     *
     * The frontend must consume this field exclusively and never reference
     * raw database timestamps for grouping or sorting.
     */
    public function getEffectiveVisitAtAttribute(): CarbonImmutable
    {
        // For long_lived passes: if used today, project next expected visit to tomorrow
        if ($this->type === 'long_lived' && $this->isActive()) {
            $tz = config('app.timezone', 'Africa/Lagos');
            $today = CarbonImmutable::now($tz)->startOfDay();

            // Check if there is an access log for today
            $usedToday = $this->relationLoaded('accessLogs')
                ? $this->accessLogs->contains(fn ($log) => $log->verified_at && CarbonImmutable::instance($log->verified_at)->setTimezone($tz)->isSameDay($today))
                : $this->accessLogs()->whereDate('verified_at', $today->toDateString())->exists();

            if ($usedToday) {
                // Already used today; next expected arrival is tomorrow
                return $today->addDay();
            }

            // If not used today: if starts_at is in the future, return starts_at; otherwise it is expected today
            if ($this->starts_at !== null && $this->starts_at->greaterThan($today->endOfDay())) {
                return $this->starts_at;
            }

            return $today;
        }

        if ($this->starts_at !== null) {
            return $this->starts_at;
        }

        // For pass types that do not support open-ended scheduling,
        // expires_at represents the deadline for the visit window.
        if ($this->expires_at !== null && in_array($this->type, ['single_use', 'event'])) {
            return $this->expires_at;
        }

        return $this->created_at;
    }

    /**
     * The canonical "when was this visit completed?" field for the Visitor Timeline.
     *
     * Precedence follows the most granular completion signal available:
     *   1. checked_out_at - visitor physically exited (most precise)
     *   2. used_at        - visitor was verified at entry
     *   3. verified_at    - legacy check-in timestamp (via latest access log)
     *   4. revoked_at     - host cancelled the visit
     *   5. expires_at     - pass window closed without entry
     *   6. created_at     - last resort
     *
     * Returns null for passes that are not yet completed (active/scheduled).
     */
    public function getCompletionAtAttribute(): ?CarbonImmutable
    {
        // Not a terminal state - visit is ongoing or pending.
        if (in_array($this->status, [AccessCodeStatus::Active, AccessCodeStatus::Scheduled])) {
            return null;
        }

        // Most granular: visitor physically left
        $latestLog = $this->accessLogs->sortByDesc('checked_out_at')->first();
        if ($latestLog?->checked_out_at !== null) {
            return CarbonImmutable::instance($latestLog->checked_out_at);
        }

        // Visitor was checked in
        if ($this->used_at !== null) {
            return $this->used_at;
        }

        // Latest access log verified_at
        $latestVerified = $this->accessLogs->sortByDesc('verified_at')->first();
        if ($latestVerified?->verified_at !== null) {
            return CarbonImmutable::instance($latestVerified->verified_at);
        }

        // Host cancelled
        if ($this->revoked_at !== null) {
            return $this->revoked_at;
        }

        // Pass window closed
        if ($this->expires_at !== null) {
            return $this->expires_at;
        }

        return $this->created_at;
    }

    public static function generateCode(): string
    {
        // Unambiguous alphabet - excludes 0, 1, I, O to prevent misreads at the gate.
        $letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $numbers = '23456789';
        $alphabet = $letters.$numbers;

        $lettersLen = strlen($letters);
        $numbersLen = strlen($numbers);
        $alphabetLen = strlen($alphabet);

        do {
            $code = '';
            // Ensure at least one letter and one number
            $code .= $letters[random_int(0, $lettersLen - 1)];
            $code .= $numbers[random_int(0, $numbersLen - 1)];

            // Fill the rest randomly
            for ($i = 0; $i < 4; $i++) {
                $code .= $alphabet[random_int(0, $alphabetLen - 1)];
            }

            // Shuffle to avoid predictable pattern (e.g. always starts with letter-number)
            $code = str_shuffle($code);

        } while (self::where('code', $code)->where('status', AccessCodeStatus::Active)->exists());

        return $code;
    }
}
