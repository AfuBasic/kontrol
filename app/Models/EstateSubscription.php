<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
