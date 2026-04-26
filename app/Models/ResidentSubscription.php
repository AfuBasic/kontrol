<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResidentSubscription extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'estate_id',
        'status',
        'billing_preference',
        'paystack_authorization_code',
        'paystack_customer_code',
        'card_brand',
        'card_last4',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'last_paid_at',
        'last_reminded_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'last_paid_at' => 'datetime',
            'last_reminded_at' => 'datetime',
            'billing_preference' => 'string',
            'paystack_authorization_code' => 'encrypted',
            'paystack_customer_code' => 'encrypted',
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
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function hasSavedCard(): bool
    {
        return ! empty($this->paystack_authorization_code);
    }

    public function isActive(): bool
    {
        // Must have an active or trial status AND the period must not have ended
        if (in_array($this->status, ['active', 'trial'])) {
            return $this->current_period_end && $this->current_period_end->isFuture();
        }

        // If past due, they are active only if still within the grace period (period end is in future)
        if ($this->status === 'past_due') {
            return $this->current_period_end && $this->current_period_end->isFuture();
        }

        return false;
    }

    public function isTrial(): bool
    {
        return $this->status === 'trial' && $this->current_period_end && $this->current_period_end->isFuture();
    }

    public function isGracePeriod(): bool
    {
        return $this->status === 'past_due' && $this->current_period_end && $this->current_period_end->isFuture();
    }

    public function isExpired(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }

        // Past due but period end is in the past = fully expired/blocked
        return $this->status === 'past_due' && $this->current_period_end && $this->current_period_end->isPast();
    }
}
