<?php

namespace App\Models;

use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Database\Factories\SecurityEventFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $ulid
 * @property int $user_id
 * @property int|null $trusted_device_id
 * @property int|null $device_authorization_request_id
 * @property SecurityEventType $type
 * @property SecurityEventSeverity $severity
 * @property SecurityEventStatus $status
 * @property string|null $display_name
 * @property string|null $approximate_location
 * @property string|null $request_ip
 * @property CarbonImmutable $detected_at
 * @property CarbonImmutable|null $resolved_at
 * @property string|null $resolution
 * @property CarbonImmutable|null $reviewed_at
 * @property int|null $reviewed_by
 * @property array<int, array<string, mixed>>|null $timeline
 * @property array<string, mixed>|null $metadata
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read User $user
 * @property-read TrustedDevice|null $trustedDevice
 * @property-read DeviceAuthorizationRequest|null $deviceAuthorizationRequest
 * @property-read User|null $reviewer
 *
 * @method static Builder<static>|SecurityEvent query()
 * @method static Builder<static>|SecurityEvent requiringAttention()
 */
class SecurityEvent extends Model
{
    /** @use HasFactory<SecurityEventFactory> */
    use GeneratesUlid, HasFactory;

    protected $fillable = [
        'user_id',
        'trusted_device_id',
        'device_authorization_request_id',
        'type',
        'severity',
        'status',
        'display_name',
        'approximate_location',
        'request_ip',
        'detected_at',
        'resolved_at',
        'resolution',
        'reviewed_at',
        'reviewed_by',
        'timeline',
        'metadata',
    ];

    protected $hidden = [
        'request_ip',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => SecurityEventType::class,
            'severity' => SecurityEventSeverity::class,
            'status' => SecurityEventStatus::class,
            'detected_at' => 'datetime',
            'resolved_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'timeline' => 'array',
            'metadata' => 'array',
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
     * @return BelongsTo<TrustedDevice, $this>
     */
    public function trustedDevice(): BelongsTo
    {
        return $this->belongsTo(TrustedDevice::class);
    }

    /**
     * @return BelongsTo<DeviceAuthorizationRequest, $this>
     */
    public function deviceAuthorizationRequest(): BelongsTo
    {
        return $this->belongsTo(DeviceAuthorizationRequest::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * @param  Builder<SecurityEvent>  $query
     * @return Builder<SecurityEvent>
     */
    public function scopeRequiringAttention(Builder $query): Builder
    {
        return $query->whereIn('status', [
            SecurityEventStatus::Pending,
            SecurityEventStatus::Denied,
            SecurityEventStatus::Blocked,
        ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function appendTimeline(string $type, string $label, array $metadata = []): void
    {
        $timeline = $this->timeline ?? [];
        $timeline[] = [
            'at' => Carbon::now()->toIso8601String(),
            'type' => $type,
            'label' => $label,
            'metadata' => $metadata,
        ];

        $this->forceFill(['timeline' => $timeline])->save();
    }
}
