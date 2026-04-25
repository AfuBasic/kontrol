<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResidentSubscription extends Model
{
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
        if ($this->status === 'active' || $this->status === 'trial') {
            return true;
        }

        if ($this->status === 'past_due') {
            return $this->current_period_end && $this->current_period_end->isFuture();
        }

        return false;
    }

    public function isPastDue(): bool
    {
        return $this->status === 'past_due' && $this->current_period_end && $this->current_period_end->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->status === 'past_due' && $this->current_period_end && $this->current_period_end->isPast());
    }
}
