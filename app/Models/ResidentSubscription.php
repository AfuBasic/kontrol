<?php

namespace App\Models;

use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int $estate_id
 * @property string $status
 * @property string|null $paystack_authorization_code
 * @property string|null $paystack_customer_code
 * @property string|null $card_brand
 * @property string|null $card_last4
 * @property CarbonImmutable|null $trial_ends_at
 * @property CarbonImmutable|null $current_period_start
 * @property CarbonImmutable|null $current_period_end
 * @property CarbonImmutable|null $last_paid_at
 * @property CarbonImmutable|null $last_reminded_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Estate $estate
 * @property-read BelongsTo<Estate, $this> $is_active
 * @property-read bool $is_grace_period
 * @property-read User $user
 *
 * @method static \Database\Factories\ResidentSubscriptionFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereCardBrand($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereCardLast4($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereCurrentPeriodEnd($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereCurrentPeriodStart($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereLastPaidAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereLastRemindedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription wherePaystackAuthorizationCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription wherePaystackCustomerCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereTrialEndsAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ResidentSubscription whereUserId($value)
 *
 * @mixin \Eloquent
 */
class ResidentSubscription extends Model
{
    use GeneratesUlid, HasFactory;

    protected $fillable = [
        'user_id',
        'estate_id',
        'plan_id',
        'status',
        'paystack_authorization_code',
        'paystack_customer_code',
        'card_brand',
        'card_last4',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'last_paid_at',
        'last_reminded_at',
        'auto_renew_enabled',
        'auto_renew_opted_out',
    ];

    /**
     * @return array<string, string>
     */
    protected $appends = ['is_active', 'is_grace_period'];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'last_paid_at' => 'datetime',
            'last_reminded_at' => 'datetime',
            'paystack_authorization_code' => 'encrypted',
            'paystack_customer_code' => 'encrypted',
            'plan_id' => 'integer',
            'auto_renew_enabled' => 'boolean',
            'auto_renew_opted_out' => 'boolean',
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
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->isActive();
    }

    public function getIsGracePeriodAttribute(): bool
    {
        return $this->isGracePeriod();
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function hasSavedCard(): bool
    {
        $raw = $this->getRawOriginal('paystack_authorization_code');

        if (empty($raw)) {
            return false;
        }

        try {
            return ! empty($this->paystack_authorization_code);
        } catch (\Throwable) {
            return false;
        }
    }

    public function isActive(): bool
    {
        // Must have an active, trial or past due status
        if (in_array($this->status, ['active', 'trial', 'past_due'])) {
            // If still within the paid/trial period
            if ($this->current_period_end && $this->current_period_end->isFuture()) {
                return true;
            }

            // If past due but still within the grace period (from estate settings)
            $graceDays = $this->estate->settings->grace_period_days ?? 2;

            return $this->current_period_end && now()->lessThan($this->current_period_end->copy()->addDays($graceDays));
        }

        return false;
    }

    public function isTrial(): bool
    {
        return $this->status === 'trial' && $this->current_period_end && $this->current_period_end->isFuture();
    }

    public function isGracePeriod(): bool
    {
        if ($this->status !== 'past_due') {
            return false;
        }

        if (! $this->current_period_end) {
            return false;
        }

        $graceDays = $this->estate->settings->grace_period_days ?? 2;

        return $this->current_period_end->isPast() &&
               now()->lessThan($this->current_period_end->copy()->addDays($graceDays));
    }

    public function isExpired(): bool
    {
        if (in_array($this->status, ['active', 'trial', 'past_due'])) {
            $graceDays = $this->estate->settings->grace_period_days ?? 2;

            return $this->current_period_end && now()->greaterThanOrEqualTo($this->current_period_end->copy()->addDays($graceDays));
        }

        return false;
    }
}
