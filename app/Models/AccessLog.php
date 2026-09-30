<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_id
 * @property int|null $organization_id
 * @property int|null $access_code_id
 * @property int|null $visitor_profile_id
 * @property string|null $entry_point
 * @property int|null $verified_by
 * @property CarbonImmutable|null $verified_at
 * @property CarbonImmutable|null $checked_out_at
 * @property string|null $exit_point
 * @property string|null $vehicle_plate_number
 * @property string|null $vehicle_make
 * @property string|null $vehicle_model
 * @property array<string, mixed>|null $meta
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Estate|null $estate
 * @property-read EstateOrganization|null $organization
 * @property-read AccessCode|null $accessCode
 * @property-read VisitorProfile|null $visitorProfile
 * @property-read User|null $verifiedBy
 *
 * @mixin \Eloquent
 */
class AccessLog extends Model
{
    protected $fillable = [
        'estate_id',
        'organization_id',
        'visitor_profile_id',
        'entry_point',
        'access_code_id',
        'verified_by',
        'verified_at',
        'checked_out_at',
        'checked_out_by',
        'exit_point',
        'vehicle_plate_number',
        'vehicle_make',
        'vehicle_model',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'immutable_datetime',
            'checked_out_at' => 'immutable_datetime',
            'meta' => 'array',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(EstateOrganization::class);
    }

    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(AccessCode::class);
    }

    public function visitorProfile(): BelongsTo
    {
        return $this->belongsTo(VisitorProfile::class, 'visitor_profile_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function checkedOutBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    public function scopeActive($query)
    {
        return $query->whereNull('checked_out_at');
    }
}
