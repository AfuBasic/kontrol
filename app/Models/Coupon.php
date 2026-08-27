<?php

namespace App\Models;

use App\Services\ZoneAudienceResolver;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
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
        'zone_id',
        'user_id',
        'type',
        'value',
        'expires_at',
        'usage_limit',
        'used_count',
        'description',
        'internal_notes',
        'campaign_name',
        'marketing_tag',
        'creator_id',
        'status',
        'eligible_plans',
        'min_purchase',
        'starts_at',
        'is_recurring',
        'billing_cycles',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'starts_at' => 'datetime',
        'value' => 'integer',
        'min_purchase' => 'integer',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'eligible_plans' => 'array',
        'creator_id' => 'integer',
    ];

    /**
     * Get the estate associated with the coupon.
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * @return BelongsTo<Zone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Get the resident associated with the coupon.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who created this coupon.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
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
     * Determine if the coupon is scheduled to start in the future.
     */
    public function isScheduled(): bool
    {
        return $this->starts_at !== null && $this->starts_at->isFuture();
    }

    /**
     * Determine if the coupon is currently inside its starts_at / expires_at window.
     */
    public function isWithinValidityPeriod(): bool
    {
        return ! $this->isExpired() && ! $this->isScheduled();
    }

    /**
     * Scope a query to coupons whose validity window includes now.
     *
     * @param  Builder<Coupon>  $query
     * @return Builder<Coupon>
     */
    public function scopeWithinValidityPeriod(Builder $query): Builder
    {
        $now = now();

        return $query
            ->where(function (Builder $q) use ($now): void {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
            })
            ->where(function (Builder $q) use ($now): void {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            });
    }

    /**
     * Scope a query to active coupons currently available to a resident in an estate.
     *
     * Does not filter personal usage limits (those require per-user log counts).
     *
     * @param  Builder<Coupon>  $query
     * @return Builder<Coupon>
     */
    public function scopeAvailableTo(Builder $query, User $user, Estate $estate): Builder
    {
        return $query
            ->where('status', 'active')
            ->withinValidityPeriod()
            ->where(function (Builder $q) use ($user, $estate): void {
                $q->where(fn (Builder $sub) => $sub->whereNull('estate_id')->whereNull('user_id'))
                    ->orWhere('estate_id', $estate->id)
                    ->orWhere('user_id', $user->id);
            });
    }

    /**
     * Determine if the coupon has reached its usage limit.
     */
    public function isLimitReached(?User $user = null): bool
    {
        // Non-recurring coupons can only be redeemed once per resident/user
        if (! $this->is_recurring && $user !== null) {
            $userUsage = $this->logs()->where('user_id', $user->id)->count();
            if ($userUsage >= 1) {
                return true;
            }
        }

        if ($this->usage_limit === null) {
            return false;
        }

        // For estate and resident level coupons, the usage limit is per-resident.
        if ($user !== null && ($this->estate_id !== null || $this->user_id !== null)) {
            $userUsage = $this->logs()->where('user_id', $user->id)->count();

            return $userUsage >= $this->usage_limit;
        }

        // Otherwise, it is a global cumulative cap.
        $actualUses = $this->logs()->count();

        return $actualUses >= $this->totalUsageLimit();
    }

    /**
     * Get the total possible redemptions for this coupon based on its scope and usage limit.
     */
    public function totalUsageLimit(): ?int
    {
        if ($this->usage_limit === null) {
            return null;
        }

        if ($this->estate_id !== null) {
            $residentsCount = User::whereHas('estates', function ($q) {
                $q->where('estates.id', $this->estate_id);
            })->whereHas('roles', function ($q) {
                $q->where('name', 'resident');
            })->count();

            return $residentsCount * $this->usage_limit;
        }

        return $this->usage_limit;
    }

    /**
     * Determine if the coupon is valid for a given resident user in a specific estate.
     */
    public function isValidFor(User $user, Estate $estate): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if (! $this->isWithinValidityPeriod()) {
            return false;
        }

        if ($this->isLimitReached($user)) {
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

        if ($this->zone_id !== null && ! app(ZoneAudienceResolver::class)->userBelongsToZone($user, $estate, (int) $this->zone_id)) {
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
