<?php

namespace App\Models;

use App\Enums\AccessCodeStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AccessCode extends Model
{
    use HasFactory;
    use LogsActivity;

    protected $fillable = [
        'estate_id',
        'user_id',
        'code',
        'type', // single_use, long_lived
        'visitor_name',
        'visitor_phone',
        'purpose',
        'status',
        'expires_at',
        'used_at',
        'revoked_at',
        'verified_by',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => AccessCodeStatus::class,
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'used_at', 'revoked_at'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => 'Access code created',
                'updated' => 'Access code updated',
                'deleted' => 'Access code deleted',
                default => "Access code {$eventName}",
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
        do {
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (self::where('code', $code)->where('status', AccessCodeStatus::Active)->exists());

        return $code;
    }
}
