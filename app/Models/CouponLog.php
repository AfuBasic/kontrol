<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $coupon_id
 * @property int $user_id
 * @property int $invoice_id
 * @property int $discount_amount
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Coupon $coupon
 * @property-read User $user
 * @property-read Invoice $invoice
 */
class CouponLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'coupon_id',
        'user_id',
        'invoice_id',
        'discount_amount',
        'subscription_id',
        'subscription_type',
    ];

    protected $casts = [
        'discount_amount' => 'integer',
    ];

    /**
     * Get the coupon associated with this log.
     */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Get the resident user associated with this log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the invoice associated with this log.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
