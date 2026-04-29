<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_id
 * @property int $plan_id
 * @property string $status
 * @property string $billing_preference
 * @property string|null $paystack_authorization_code
 * @property string|null $paystack_customer_code
 * @property string|null $card_brand
 * @property string|null $card_last4
 * @property string $billing_interval
 * @property int|null $billing_anchor_day
 * @property \Carbon\CarbonImmutable|null $next_billing_date
 * @property \Carbon\CarbonImmutable|null $trial_ends_at
 * @property \Carbon\CarbonImmutable|null $current_period_end
 * @property int|null $overridden_by Zeus admin ID who overrode the plan
 * @property string|null $override_notes
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \App\Models\Estate $estate
 * @property-read \App\Models\Plan $plan
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription active()
 * @method static \Database\Factories\EstateSubscriptionFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription onTrial()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereBillingAnchorDay($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereBillingInterval($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereBillingPreference($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereCardBrand($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereCardLast4($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereCurrentPeriodEnd($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereNextBillingDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereOverriddenBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereOverrideNotes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription wherePaystackAuthorizationCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription wherePaystackCustomerCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription wherePlanId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereTrialEndsAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSubscription whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class EstateSubscription extends Model
{
    use HasFactory;

    protected $table = 'estate_subscriptions';

    protected $fillable = [
        'estate_id',
        'plan_id',
        'status',
        'billing_preference',
        'paystack_authorization_code',
        'paystack_customer_code',
        'card_brand',
        'card_last4',
        'billing_interval',
        'trial_ends_at',
        'current_period_end',
        'overridden_by',
        'override_notes',
        'billing_anchor_day',
        'next_billing_date',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_end' => 'datetime',
        'next_billing_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'billing_preference' => 'string',
        'paystack_authorization_code' => 'encrypted',
        'paystack_customer_code' => 'encrypted',
    ];

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function hasSavedCard(): bool
    {
        return ! empty($this->paystack_authorization_code);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isOnTrial(): bool
    {
        return $this->status === 'trial' && $this->trial_ends_at?->isFuture();
    }

    public function isPastDue(): bool
    {
        return $this->status === 'past_due';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function scopeActive(mixed $query): mixed
    {
        return $query->where('status', 'active');
    }

    public function scopeOnTrial(mixed $query): mixed
    {
        return $query->where('status', 'trial')
            ->where('trial_ends_at', '>', now());
    }
}
