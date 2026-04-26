<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
