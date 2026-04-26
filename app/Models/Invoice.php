<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'user_id',
        'plan_id',
        'estate_subscription_id',
        'invoice_number',
        'amount',
        'resident_count',
        'billing_period_start',
        'billing_period_end',
        'due_date',
        'status',
        'paystack_reference',
        'paystack_access_code',
        'paid_at',
        'notified_at',
        'last_sent_email_at',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'integer',
        'resident_count' => 'integer',
        'billing_period_start' => 'date',
        'billing_period_end' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'notified_at' => 'datetime',
        'last_sent_email_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['formatted_amount'];

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

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<EstateSubscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(EstateSubscription::class, 'estate_subscription_id');
    }

    /**
     * @return HasMany<PaymentTransaction, $this>
     */
    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class)->latest();
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'overdue';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isWithinGracePeriod(): bool
    {
        if ($this->isPaid()) {
            return false;
        }

        return now()->lessThanOrEqualTo($this->due_date);
    }

    public function canSendEmail(): bool
    {
        if (! $this->last_sent_email_at) {
            return true;
        }

        return $this->last_sent_email_at->addSeconds(60)->isPast();
    }

    public function getEmailCooldownSeconds(): int
    {
        if (! $this->last_sent_email_at) {
            return 0;
        }

        $nextAllowedTime = $this->last_sent_email_at->addSeconds(60);
        $secondsRemaining = (int) now()->diffInSeconds($nextAllowedTime, false);

        return max(0, $secondsRemaining);
    }

    public function getFormattedAmountAttribute(): string
    {
        $naira = $this->amount / 100;

        return '₦'.number_format($naira, 2);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', 'overdue');
    }
}
