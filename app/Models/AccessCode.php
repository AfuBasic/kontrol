<?php

namespace App\Models;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
 * @property \Carbon\CarbonImmutable|null $expires_at
 * @property \Carbon\CarbonImmutable|null $used_at
 * @property \Carbon\CarbonImmutable|null $revoked_at
 * @property int|null $verified_by
 * @property string|null $notes
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\AccessLog> $accessLogs
 * @property-read int|null $access_logs_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Activity> $activities
 * @property-read int|null $activities_count
 * @property-read \App\Models\Estate $estate
 * @property-read string $time_remaining
 * @property-read \App\Models\User $user
 * @property-read \App\Models\User|null $verifiedBy
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
        'type', // single_use, long_lived
        'source', // web, telegram
        'visitor_name',
        'visitor_phone',
        'purpose',
        'status',
        'expires_at',
        'used_at',
        'revoked_at',
        'verified_by',
        'has_vehicle',
        'notes',
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
            'revoked_at' => 'datetime',
            'has_vehicle' => 'boolean',
        ];
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
        return $query->where('status', AccessCodeStatus::Active)
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
        // If expired_at is null, means it never expires (long_lived)
        if ($this->expires_at === null) {
            return $this->status === AccessCodeStatus::Active;
        }

        return $this->status === AccessCodeStatus::Active && $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    public function markAsUsed(?User $verifiedBy = null): void
    {
        $this->update([
            'status' => AccessCodeStatus::Used,
            'used_at' => now(),
            'verified_by' => $verifiedBy?->id,
        ]);
    }

    public function revoke(): void
    {
        $this->update([
            'status' => AccessCodeStatus::Revoked,
            'revoked_at' => now(),
        ]);
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

    public static function generateCode(): string
    {
        // Unambiguous alphabet — excludes 0, 1, I, O to prevent misreads at the gate.
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
