<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $estate_id
 * @property int|null $user_id
 * @property int $plan_id
 * @property int|null $estate_subscription_id
 * @property string $invoice_number
 * @property int $amount Amount in kobo
 * @property int $resident_count Snapshot of active residents at generation
 * @property \Carbon\CarbonImmutable $billing_period_start
 * @property \Carbon\CarbonImmutable $billing_period_end
 * @property \Carbon\CarbonImmutable $due_date
 * @property string $status
 * @property string|null $paystack_reference
 * @property string|null $paystack_access_code
 * @property array<array-key, mixed>|null $metadata
 * @property \Carbon\CarbonImmutable|null $paid_at
 * @property \Carbon\CarbonImmutable|null $notified_at
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property \Carbon\CarbonImmutable|null $last_sent_email_at
 * @property-read \App\Models\Estate $estate
 * @property-read string $formatted_amount
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\PaymentTransaction> $paymentTransactions
 * @property-read int|null $payment_transactions_count
 * @property-read \App\Models\Plan $plan
 * @property-read \App\Models\EstateSubscription|null $subscription
 * @property-read \App\Models\User|null $user
 * @method static \Database\Factories\InvoiceFactory factory($count = null, $state = [])
 * @method static Builder<static>|Invoice newModelQuery()
 * @method static Builder<static>|Invoice newQuery()
 * @method static Builder<static>|Invoice overdue()
 * @method static Builder<static>|Invoice paid()
 * @method static Builder<static>|Invoice pending()
 * @method static Builder<static>|Invoice query()
 * @method static Builder<static>|Invoice whereAmount($value)
 * @method static Builder<static>|Invoice whereBillingPeriodEnd($value)
 * @method static Builder<static>|Invoice whereBillingPeriodStart($value)
 * @method static Builder<static>|Invoice whereCreatedAt($value)
 * @method static Builder<static>|Invoice whereDueDate($value)
 * @method static Builder<static>|Invoice whereEstateId($value)
 * @method static Builder<static>|Invoice whereEstateSubscriptionId($value)
 * @method static Builder<static>|Invoice whereId($value)
 * @method static Builder<static>|Invoice whereInvoiceNumber($value)
 * @method static Builder<static>|Invoice whereLastSentEmailAt($value)
 * @method static Builder<static>|Invoice whereMetadata($value)
 * @method static Builder<static>|Invoice whereNotifiedAt($value)
 * @method static Builder<static>|Invoice wherePaidAt($value)
 * @method static Builder<static>|Invoice wherePaystackAccessCode($value)
 * @method static Builder<static>|Invoice wherePaystackReference($value)
 * @method static Builder<static>|Invoice wherePlanId($value)
 * @method static Builder<static>|Invoice whereResidentCount($value)
 * @method static Builder<static>|Invoice whereStatus($value)
 * @method static Builder<static>|Invoice whereUpdatedAt($value)
 * @method static Builder<static>|Invoice whereUserId($value)
 * @mixin \Eloquent
 */
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
