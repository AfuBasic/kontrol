<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $invoice_id
 * @property int $estate_id
 * @property int|null $user_id
 * @property string $paystack_reference
 * @property string $provider
 * @property string $idempotency_key
 * @property int $amount Amount in kobo
 * @property string $currency
 * @property string $status
 * @property string|null $payment_method
 * @property string|null $customer_email
 * @property string|null $error_code
 * @property string|null $error_message
 * @property \Carbon\CarbonImmutable|null $verified_at
 * @property \Carbon\CarbonImmutable|null $recorded_at
 * @property int $attempt_count
 * @property array<array-key, mixed>|null $metadata Additional payment data from Paystack
 * @property \Carbon\CarbonImmutable|null $created_at
 * @property \Carbon\CarbonImmutable|null $updated_at
 * @property-read \App\Models\Estate $estate
 * @property-read \App\Models\Invoice|null $invoice
 * @property-read \App\Models\User|null $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction failed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction pending()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction successful()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereAttemptCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereCurrency($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereCustomerEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereErrorCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereErrorMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereIdempotencyKey($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereInvoiceId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereMetadata($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction wherePaymentMethod($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction wherePaystackReference($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereProvider($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereRecordedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|PaymentTransaction whereVerifiedAt($value)
 *
 * @mixin \Eloquent
 */
class PaymentTransaction extends Model
{
    protected $fillable = [
        'invoice_id',
        'estate_id',
        'user_id',
        'paystack_reference',
        'provider',
        'idempotency_key',
        'amount',
        'currency',
        'status',
        'payment_method',
        'customer_email',
        'error_code',
        'error_message',
        'verified_at',
        'recorded_at',
        'attempt_count',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'int',
        'attempt_count' => 'int',
        'verified_at' => 'datetime',
        'recorded_at' => 'datetime',
        'metadata' => 'json',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Check if payment is already recorded (idempotency).
     */
    public function isRecorded(): bool
    {
        return $this->status === 'success' && $this->recorded_at !== null;
    }

    /**
     * Check if payment verification passed.
     */
    public function isVerified(): bool
    {
        return $this->verified_at !== null && $this->status === 'success';
    }
}
