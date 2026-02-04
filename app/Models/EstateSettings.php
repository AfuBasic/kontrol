<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class EstateSettings extends Model
{
    protected $fillable = [
        'estate_id',
        'access_codes_enabled',
        'access_code_min_lifespan_minutes',
        'access_code_max_lifespan_minutes',
        'access_code_single_use',
        'access_code_grace_period_minutes',
        'access_code_daily_limit_per_resident',
        'access_code_require_confirmation',
        'contacts',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'access_codes_enabled' => 'boolean',
            'access_code_single_use' => 'boolean',
            'access_code_require_confirmation' => 'boolean',
            'contacts' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * Get cached settings for an estate.
     */
    public static function forEstate(int $estateId): self
    {
        return Cache::remember(
            "estate_settings:{$estateId}",
            now()->addMinutes(15),
            fn () => self::firstOrCreate(['estate_id' => $estateId])
        );
    }

    protected static function booted(): void
    {
        static::saved(fn ($settings) => Cache::forget("estate_settings:{$settings->estate_id}"));
    }
}
