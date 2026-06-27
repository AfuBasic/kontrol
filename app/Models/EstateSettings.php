<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property int $estate_id
 * @property bool $access_codes_enabled
 * @property int $access_code_min_lifespan_minutes
 * @property int $access_code_max_lifespan_minutes
 * @property bool $access_code_single_use
 * @property int $access_code_grace_period_minutes
 * @property int|null $access_code_daily_limit_per_resident
 * @property bool $access_code_require_confirmation
 * @property string $charge_type
 * @property array<array-key, mixed>|null $contacts
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property bool $free_trial_enabled
 * @property int $free_trial_days
 * @property int $grace_period_days
 * @property-read Estate $estate
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereAccessCodeDailyLimitPerResident($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereAccessCodeGracePeriodMinutes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereAccessCodeMaxLifespanMinutes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereAccessCodeMinLifespanMinutes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereAccessCodeRequireConfirmation($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereAccessCodeSingleUse($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereAccessCodesEnabled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereChargeType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereContacts($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereFreeTrialDays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereFreeTrialEnabled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereGracePeriodDays($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EstateSettings whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
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
        'visitor_checkout_enabled',
        'charge_type',
        'contacts',
        'free_trial_enabled',
        'free_trial_days',
        'grace_period_days',
        'bank_name',
        'bank_code',
        'account_number',
        'account_name',
        'paystack_subaccount_code',
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
            'visitor_checkout_enabled' => 'boolean',
            'free_trial_enabled' => 'boolean',
            'free_trial_days' => 'integer',
            'grace_period_days' => 'integer',
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
            fn () => self::firstOrCreate(['estate_id' => $estateId])->refresh()
        );
    }

    protected static function booted(): void
    {
        static::saved(fn ($settings) => Cache::forget("estate_settings:{$settings->estate_id}"));
    }
}
