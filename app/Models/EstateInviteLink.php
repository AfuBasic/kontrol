<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_id
 * @property string $token
 * @property bool $is_active
 * @property int $usage_count
 * @property int|null $max_usages Maximum number of users allowed to use this link (null for unlimited)
 * @property bool $requires_approval Whether residents joining via this link require admin approval
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Estate $estate
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereMaxUsages($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereRequiresApproval($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateInviteLink whereUsageCount($value)
 *
 * @mixin \Eloquent
 */
class EstateInviteLink extends Model
{
    protected $fillable = [
        'estate_id',
        'role',
        'token',
        'is_active',
        'usage_count',
        'max_usages',
        'requires_approval',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer',
        'max_usages' => 'integer',
        'requires_approval' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function isFull(): bool
    {
        return $this->max_usages !== null && $this->usage_count >= $this->max_usages;
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->isFull()) {
            return false;
        }

        if ($this->isExpired()) {
            return false;
        }

        return true;
    }
}
