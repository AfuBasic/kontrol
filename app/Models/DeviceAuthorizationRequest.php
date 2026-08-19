<?php

namespace App\Models;

use App\Enums\DeviceAuthorizationStatus;
use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Database\Factories\DeviceAuthorizationRequestFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $ulid
 * @property int $user_id
 * @property string $token_hash
 * @property string $display_name
 * @property string|null $device_type
 * @property string|null $platform
 * @property string|null $browser
 * @property string|null $approximate_location
 * @property string|null $request_ip
 * @property DeviceAuthorizationStatus $status
 * @property bool $remember
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $approved_at
 * @property CarbonImmutable|null $denied_at
 * @property CarbonImmutable|null $consumed_at
 * @property CarbonImmutable|null $last_notified_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 *
 * @method static Builder<static>|DeviceAuthorizationRequest pending()
 * @method static Builder<static>|DeviceAuthorizationRequest query()
 */
class DeviceAuthorizationRequest extends Model
{
    /** @use HasFactory<DeviceAuthorizationRequestFactory> */
    use GeneratesUlid, HasFactory, MassPrunable;

    protected $fillable = [
        'user_id',
        'token_hash',
        'display_name',
        'device_type',
        'platform',
        'browser',
        'approximate_location',
        'request_ip',
        'status',
        'remember',
        'expires_at',
        'approved_at',
        'denied_at',
        'consumed_at',
        'last_notified_at',
    ];

    protected $hidden = [
        'token_hash',
        'request_ip',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => DeviceAuthorizationStatus::class,
            'remember' => 'boolean',
            'expires_at' => 'datetime',
            'approved_at' => 'datetime',
            'denied_at' => 'datetime',
            'consumed_at' => 'datetime',
            'last_notified_at' => 'datetime',
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
     * @return HasOne<SecurityEvent, $this>
     */
    public function securityEvent(): HasOne
    {
        return $this->hasOne(SecurityEvent::class);
    }

    /**
     * @param  Builder<DeviceAuthorizationRequest>  $query
     * @return Builder<DeviceAuthorizationRequest>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query
            ->where('status', DeviceAuthorizationStatus::Pending)
            ->where('expires_at', '>', now());
    }

    public function isPending(): bool
    {
        return $this->status === DeviceAuthorizationStatus::Pending
            && $this->expires_at->isFuture();
    }

    public function isApproved(): bool
    {
        return $this->status === DeviceAuthorizationStatus::Approved
            && $this->consumed_at === null;
    }

    public function isDenied(): bool
    {
        return $this->status === DeviceAuthorizationStatus::Denied;
    }

    public function isExpired(): bool
    {
        return $this->status === DeviceAuthorizationStatus::Expired
            || ($this->status === DeviceAuthorizationStatus::Pending && $this->expires_at->isPast());
    }

    public function isConsumed(): bool
    {
        return $this->status === DeviceAuthorizationStatus::Consumed
            || $this->consumed_at !== null;
    }

    /**
     * @return Builder<DeviceAuthorizationRequest>
     */
    public function prunable(): Builder
    {
        $days = (int) config('device-trust.authorization_retention_days');

        return static::query()
            ->where('created_at', '<=', now()->subDays($days))
            ->whereIn('status', [
                DeviceAuthorizationStatus::Consumed,
                DeviceAuthorizationStatus::Denied,
                DeviceAuthorizationStatus::Expired,
            ]);
    }
}
