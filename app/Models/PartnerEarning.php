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
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Partner $partner
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

    public function isSettled(): bool
    {
        return $this->settled_at !== null;
    }
}
