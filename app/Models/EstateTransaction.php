<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property string $ulid
 * @property int $estate_id
 * @property int|null $user_id
 * @property int|null $collection_id
 * @property int|null $collection_assignment_id
 * @property int|null $invoice_id
 * @property int|null $created_by
 * @property int|null $approved_by
 * @property int|null $parent_id
 * @property TransactionType $type
 * @property TransactionDirection $direction
 * @property int $amount
 * @property string $currency
 * @property TransactionStatus $status
 * @property PaymentMethod|null $payment_method
 * @property string|null $provider
 * @property string $reference_number
 * @property string|null $gateway_reference
 * @property string|null $receipt_number
 * @property string|null $description
 * @property string|null $reason
 * @property string|null $coupon_code
 * @property array<array-key, mixed>|null $metadata
 * @property array<array-key, mixed>|null $gateway_response
 * @property string|null $source_type
 * @property int|null $source_id
 * @property string $idempotency_key
 * @property CarbonImmutable|null $paid_at
 * @property CarbonImmutable|null $failed_at
 * @property CarbonImmutable|null $reversed_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class EstateTransaction extends Model
{
    use GeneratesUlid;
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'user_id',
        'collection_id',
        'collection_assignment_id',
        'invoice_id',
        'created_by',
        'approved_by',
        'parent_id',
        'type',
        'direction',
        'amount',
        'currency',
        'status',
        'payment_method',
        'provider',
        'reference_number',
        'gateway_reference',
        'receipt_number',
        'description',
        'reason',
        'coupon_code',
        'metadata',
        'gateway_response',
        'source_type',
        'source_id',
        'idempotency_key',
        'paid_at',
        'failed_at',
        'reversed_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => TransactionType::class,
            'direction' => TransactionDirection::class,
            'status' => TransactionStatus::class,
            'payment_method' => PaymentMethod::class,
            'amount' => 'integer',
            'metadata' => 'array',
            'gateway_response' => 'array',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
            'reversed_at' => 'datetime',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(CollectionAssignment::class, 'collection_assignment_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function audits(): HasMany
    {
        return $this->hasMany(EstateTransactionAudit::class);
    }

    public function signedAmount(): int
    {
        return $this->amount * $this->direction->multiplier();
    }

    public function isSuccessful(): bool
    {
        return $this->status === TransactionStatus::Success;
    }
}
