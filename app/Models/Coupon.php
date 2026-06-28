<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property int|null $estate_id
 * @property int|null $user_id
 * @property string $type
 * @property int $value
 * @property CarbonImmutable|null $expires_at
 * @property int|null $usage_limit
 * @property int $used_count
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Estate|null $estate
 * @property-read User|null $user
 */
class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'estate_id',
        'user_id',
        'type',
        'value',
        'expires_at',
        'usage_limit',
        'used_count',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'value' => 'integer',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
    ];

    /**
     * Get the estate associated with the coupon.
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * Get the resident associated with the coupon.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the logs/usages associated with the coupon.
     */
    public function logs(): HasMany
    {
        return $this->hasMany(CouponLog::class);
    }

    /**
     * Determine if the coupon is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Determine if the coupon has reached its usage limit.
     */
    public function isLimitReached(): bool
    {
        return $this->usage_limit !== null && $this->used_count >= $this->usage_limit;
    }

    /**
     * Determine if the coupon is valid for a given resident user in a specific estate.
     */
    public function isValidFor(User $user, Estate $estate): bool
    {
        if ($this->isExpired()) {
            return false;
        }

        if ($this->isLimitReached()) {
            return false;
        }

        // If it's restricted to an estate, the resident must belong to that estate
        if ($this->estate_id !== null && $this->estate_id !== $estate->id) {
            return false;
        }

        // If it's restricted to a specific resident/user, it must match
        if ($this->user_id !== null && $this->user_id !== $user->id) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount amount for a given original amount (in kobo).
     */
    public function calculateDiscount(int $originalAmount): int
    {
        if ($this->type === 'percentage') {
            // value is a percentage (e.g. 10 for 10%)
            $discount = (int) round(($originalAmount * $this->value) / 100);

            return min($discount, $originalAmount);
        }

        if ($this->type === 'fixed') {
            // value is fixed amount in kobo (e.g. 50000 for 500 Naira)
            return min($this->value, $originalAmount);
        }

        return 0;
    }
}
