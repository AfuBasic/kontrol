<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'commission_rate',
        'commission_type',
        'source_partner_id',
        'duration_months',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'duration_months' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function sourcePartner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'source_partner_id');
    }

    /**
     * @return HasMany<Estate, $this>
     */
    public function estates(): HasMany
    {
        return $this->hasMany(Estate::class);
    }

    public static function cloneFromPartner(Partner $partner): self
    {
        return self::create([
            'name' => "{$partner->name} Commission Plan",
            'commission_rate' => $partner->commission_rate,
            'commission_type' => $partner->commission_type,
            'source_partner_id' => $partner->id,
            'duration_months' => 12,
            'notes' => "Cloned from partner #{$partner->id} at ".now()->toDateTimeString(),
        ]);
    }
}
