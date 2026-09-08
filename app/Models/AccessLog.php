<?php

namespace App\Models;

use App\Traits\ZoneScoped;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_id
 * @property int|null $access_code_id
 * @property int $verified_by
 * @property CarbonImmutable|null $checked_out_at
 * @property int|null $checked_out_by
 * @property array<array-key, mixed>|null $meta
 * @property CarbonImmutable $verified_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read AccessCode|null $accessCode
 * @property-read Estate $estate
 * @property-read User $verifier
 * @property-read User|null $checkoutVerifier
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereAccessCodeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereMeta($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AccessLog whereVerifiedBy($value)
 *
 * @mixin \Eloquent
 */
class AccessLog extends Model
{
    use ZoneScoped;

    protected $fillable = [
        'estate_id',
        'organization_id',
        'zone_id',
        'entry_point',
        'access_code_id',
        'verified_by',
        'verified_at',
        'confirmed_at',
        'confirmed_by',
        'vehicle_make',
        'vehicle_model',
        'vehicle_plate_number',
        'checked_out_at',
        'checked_out_by',
        'meta',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'meta' => 'array',
    ];

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(EstateOrganization::class, 'organization_id');
    }

    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(AccessCode::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function checkoutVerifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    /**
     * Compute derived confirmation state: 'NOT_REQUIRED' | 'CONFIRMED' | 'PENDING' | 'OVERDUE'.
     */
    public function confirmationState(?int $windowMinutes = null): string
    {
        if (! $this->organization_id) {
            return 'NOT_REQUIRED';
        }

        if ($this->confirmed_at) {
            return 'CONFIRMED';
        }

        // If organization relationship is loaded or exists, check policy
        $org = $this->organization;
        if ($org && (! $org->arrival_confirmation_required || $org->isUnrestricted())) {
            return 'NOT_REQUIRED';
        }

        $window = $windowMinutes ?? ($org?->confirmation_window_minutes ?? 15);
        $entryTime = $this->verified_at ?? $this->created_at;

        if ($entryTime && $entryTime->copy()->addMinutes($window)->isPast()) {
            return 'OVERDUE';
        }

        return 'PENDING';
    }
}
