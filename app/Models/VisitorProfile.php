<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @extends Model<VisitorProfile>
 *
 * @method static \Illuminate\Database\Eloquent\Builder|VisitorProfile forEstate(int $estateId)
 *
 * @property int $id
 * @property int $estate_id
 * @property string $name
 * @property string $id_photo_hash
 * @property string|null $id_photo_path
 * @property CarbonImmutable $first_seen_at
 * @property CarbonImmutable|null $last_seen_at
 * @property int $visit_count
 * @property string|null $notes
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 *
 * Not zone-scoped: a visitor's identity belongs to the estate, the table has no zone_id,
 * and lookups always filter by estate_id explicitly.
 *
 * @mixin \Eloquent
 */
class VisitorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'name',
        'id_photo_hash',
        'id_photo_path',
        'first_seen_at',
        'last_seen_at',
        'visit_count',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'first_seen_at' => 'immutable_datetime',
            'last_seen_at' => 'immutable_datetime',
            'visit_count' => 'integer',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(AccessLog::class, 'visitor_profile_id');
    }

    public function scopeForEstate($query, int $estateId): Builder
    {
        return $query->where('estate_id', $estateId);
    }
}
