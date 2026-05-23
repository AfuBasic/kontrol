<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $estate_id
 * @property int $access_code_id
 * @property int $verified_by
 * @property array<array-key, mixed>|null $meta
 * @property CarbonImmutable $verified_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read AccessCode $accessCode
 * @property-read Estate $estate
 * @property-read User $verifier
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
    protected $fillable = [
        'estate_id',
        'access_code_id',
        'verified_by',
        'verified_at',
        'vehicle_make',
        'vehicle_model',
        'vehicle_plate_number',
        'meta',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'meta' => 'array',
    ];

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(AccessCode::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
