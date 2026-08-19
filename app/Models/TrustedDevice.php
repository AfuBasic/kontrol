<?php

namespace App\Models;

use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Database\Factories\TrustedDeviceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $ulid
 * @property int $user_id
 * @property string|null $token_hash
 * @property string|null $display_name
 * @property string|null $device_type
 * @property string|null $platform
 * @property string|null $browser
 * @property string|null $user_agent_hash
 * @property string|null $ip_address
 * @property string|null $approximate_location
 * @property string|null $last_session_id
 * @property CarbonImmutable|null $last_used_at
 * @property CarbonImmutable|null $first_seen_at
 * @property CarbonImmutable|null $trusted_at
 * @property CarbonImmutable|null $revoked_at
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 *
 * @method static Builder<static>|TrustedDevice active()
 * @method static Builder<static>|TrustedDevice query()
 */
class TrustedDevice extends Model
{
    /** @use HasFactory<TrustedDeviceFactory> */
    use GeneratesUlid, HasFactory;

    protected $fillable = [
        'user_id',
        'token_hash',
        'display_name',
        'device_type',
        'platform',
        'browser',
        'user_agent_hash',
        'ip_address',
        'approximate_location',
        'last_session_id',
        'last_used_at',
        'first_seen_at',
        'trusted_at',
        'revoked_at',
        'expires_at',
    ];

    protected $hidden = [
        'token_hash',
        'user_agent_hash',
        'last_session_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'first_seen_at' => 'datetime',
            'trusted_at' => 'datetime',
            'revoked_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<SecurityEvent, $this>
     */
    public function securityEvents(): HasMany
    {
        return $this->hasMany(SecurityEvent::class);
    }

    /**
     * @param  Builder<TrustedDevice>  $query
     * @return Builder<TrustedDevice>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->whereNotNull('token_hash')
            ->whereNull('revoked_at')
            ->where(function (Builder $builder): void {
                $builder->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function isActive(): bool
    {
        if ($this->token_hash === null || $this->revoked_at !== null) {
            return false;
        }

        if ($this->expires_at !== null && $this->expires_at->lte(now())) {
            return false;
        }

        $inactivityDays = (int) config('device-trust.inactivity_days');
        $lastSeen = $this->last_used_at ?? $this->trusted_at ?? $this->created_at;

        if ($lastSeen && $lastSeen->lt(now()->subDays($inactivityDays))) {
            return false;
        }

        return true;
    }

    public function isCurrent(string $tokenHash): bool
    {
        return $this->token_hash !== null
            && hash_equals($this->token_hash, $tokenHash);
    }
}
