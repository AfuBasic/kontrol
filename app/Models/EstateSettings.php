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
        'entry_point_checkout_enforced',
        'entry_points',
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
        'require_vehicle_information',
        'allow_residents_to_extend_visitor_passes',
        'incident_categories',
        'default_incident_severity',
        'require_photo_evidence_for_incidents',
        'require_resolution_notes_for_incidents',
        'allow_residents_to_report_incidents',
        'notify_admins_immediately_for_critical_incidents',
        'allow_partial_payments',
        'minimum_partial_payment_percentage',
        'collection_reminder_frequency',
        'collection_maximum_reminder_attempts',
        'send_reminder_before_due_date_days',
        'onboarding_completed',
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
            'entry_point_checkout_enforced' => 'boolean',
            'entry_points' => 'array',
            'require_vehicle_information' => 'boolean',
            'allow_residents_to_extend_visitor_passes' => 'boolean',
            'incident_categories' => 'array',
            'require_photo_evidence_for_incidents' => 'boolean',
            'require_resolution_notes_for_incidents' => 'boolean',
            'allow_residents_to_report_incidents' => 'boolean',
            'notify_admins_immediately_for_critical_incidents' => 'boolean',
            'allow_partial_payments' => 'boolean',
            'minimum_partial_payment_percentage' => 'integer',
            'collection_maximum_reminder_attempts' => 'integer',
            'send_reminder_before_due_date_days' => 'integer',
            'free_trial_enabled' => 'boolean',
            'free_trial_days' => 'integer',
            'grace_period_days' => 'integer',
            'contacts' => 'array',
            'onboarding_completed' => 'boolean',
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
            fn() => self::firstOrCreate(['estate_id' => $estateId])->refresh()
        );
    }

    /**
     * Resolve incident categories for an estate, ensuring defaults and 'Other' option.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function resolveCategoriesForEstate(int $estateId): array
    {
        $settings = self::forEstate($estateId);
        $configured = $settings->incident_categories ?: [
            'Theft',
            'Noise Complaint',
            'Vandalism',
            'Unauthorized Entry',
            'Property Damage',
            'Medical Emergency',
        ];

        // Ensure 'Other' is always present as an option
        $hasOther = false;
        foreach ($configured as $cat) {
            if (strtolower(trim($cat)) === 'other') {
                $hasOther = true;
                break;
            }
        }

        if (!$hasOther) {
            $configured[] = 'Other';
        }

        return collect($configured)->map(fn($cat) => [
            'value' => $cat,
            'label' => $cat,
        ])->values()->toArray();
    }

    protected static function booted(): void
    {
        static::saved(fn($settings) => Cache::forget("estate_settings:{$settings->estate_id}"));
    }
}
