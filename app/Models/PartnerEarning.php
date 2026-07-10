<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $partner_id
 * @property string $month Date string in Y-m-d format (1st of month)
 * @property int $total_amount Total commission in kobo/cents
 * @property int $revenue_amount Total gross revenue in kobo/cents
 * @property CarbonImmutable|null $settled_at
 * @property string|null $payment_reference
 * @property string|null $payment_note
 * @property int|null $settled_by_user_id
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Partner $partner
 * @property-read User|null $settledBy
 */
class PartnerEarning extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'month',
        'total_amount',
        'revenue_amount',
        'settled_at',
        'payment_reference',
        'payment_note',
        'settled_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'month' => 'date',
            'total_amount' => 'integer',
            'revenue_amount' => 'integer',
            'settled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function settledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'settled_by_user_id');
    }

    public function isSettled(): bool
    {
        return $this->settled_at !== null;
    }

    public function isPendingSettlement(): bool
    {
        return $this->settled_at === null;
    }

    public function isAccruing(): bool
    {
        if ($this->settled_at !== null) {
            return false;
        }

        $month = $this->month instanceof CarbonImmutable
            ? $this->month
            : CarbonImmutable::parse((string) $this->month);

        return $month->isSameMonth(CarbonImmutable::now());
    }

    /**
     * Partner-facing status key: accruing | pending | paid
     */
    public function statusKey(): string
    {
        if ($this->isSettled()) {
            return 'paid';
        }

        return $this->isAccruing() ? 'accruing' : 'pending';
    }

    public function statusLabel(): string
    {
        return match ($this->statusKey()) {
            'paid' => 'Paid',
            'accruing' => 'Accruing',
            default => 'Pending Settlement',
        };
    }

    public function maskedPaymentReference(): ?string
    {
        if ($this->payment_reference === null || $this->payment_reference === '') {
            return null;
        }

        $ref = $this->payment_reference;
        $len = strlen($ref);

        if ($len <= 4) {
            return str_repeat('•', $len);
        }

        return str_repeat('•', max(0, $len - 4)).substr($ref, -4);
    }
}
